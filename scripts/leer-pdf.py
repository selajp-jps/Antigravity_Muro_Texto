#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Extractor de texto de PDFs usando UNICAMENTE la libreria estandar de Python.

    Uso:  python scripts/leer-pdf.py "archivo.pdf" [-o salida.txt]

Por que existe: el entorno donde trabajo no permite instalar paquetes (pip)
ni depender de internet, y los PDF que exporta Google Docs guardan el texto
comprimido (FlateDecode) con fuentes CID y tablas /ToUnicode. Este script
descomprime los flujos, lee esas tablas y reconstruye el texto plano.

Pensado para los PDF del proyecto (manuales exportados de Google Docs /
Skia). Para PDFs escaneados (imagenes) no sirve: no tienen capa de texto.
"""

import argparse
import re
import sys
import zlib

OBJ_RE = re.compile(rb'(\d+)\s+(\d+)\s+obj\b(.*?)\bendobj', re.DOTALL)
STREAM_RE = re.compile(rb'stream\r?\n(.*?)\r?\nendstream', re.DOTALL)


# --------------------------------------------------------------------------
#  Objetos y flujos
# --------------------------------------------------------------------------
def parse_objects(data):
    """Devuelve {num_objeto: {'body': bytes, 'stream': bytes|None}}."""
    objs = {}
    for m in OBJ_RE.finditer(data):
        num = int(m.group(1))
        body = m.group(3)
        stream = None
        sm = STREAM_RE.search(body)
        if sm:
            raw = sm.group(1)
            dict_part = body[:sm.start()]
            if b'FlateDecode' in dict_part:
                stream = inflate(raw)
            else:
                stream = raw
        objs[num] = {'body': body, 'stream': stream}
    return objs


def inflate(raw):
    try:
        return zlib.decompress(raw)
    except zlib.error:
        pass
    try:
        return zlib.decompressobj().decompress(raw)
    except Exception:
        return None


def ref_of(body, key):
    m = re.search(key.encode() + rb'\s+(\d+)\s+\d+\s+R', body)
    return int(m.group(1)) if m else None


def refs_of(body, key):
    m = re.search(key.encode() + rb'\s*\[(.*?)\]', body, re.DOTALL)
    if not m:
        return []
    return [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', m.group(1))]


def fonts_of(body):
    """{nombre_recurso: num_objeto} del diccionario /Font de una pagina."""
    out = {}
    m = re.search(rb'/Font\s*<<(.*?)>>', body, re.DOTALL)
    if m:
        for name, num in re.findall(
                rb'/([A-Za-z0-9#\-\+_.]+)\s+(\d+)\s+\d+\s+R', m.group(1)):
            out[name.decode('latin-1')] = int(num)
    return out


# --------------------------------------------------------------------------
#  Tablas /ToUnicode (codigo de glifo -> caracter)
# --------------------------------------------------------------------------
def hex_to_text(h):
    if len(h) % 4 == 0:
        try:
            return bytes.fromhex(h).decode('utf-16-be')
        except Exception:
            pass
    if len(h) % 2:
        h = '0' + h
    try:
        return bytes.fromhex(h).decode('latin-1')
    except Exception:
        return ''


def parse_tounicode(blob):
    text = blob.decode('latin-1', 'replace')
    table = {}
    for block in re.findall(r'beginbfchar(.*?)endbfchar', text, re.DOTALL):
        for src, dst in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', block):
            table[int(src, 16)] = hex_to_text(dst)
    for block in re.findall(r'beginbfrange(.*?)endbfrange', text, re.DOTALL):
        for lo, hi, dst in re.findall(
                r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', block):
            lo_i, hi_i, base = int(lo, 16), int(hi, 16), int(dst, 16)
            for i in range(lo_i, hi_i + 1):
                table[i] = chr(base + (i - lo_i))
        for lo, hi, arr in re.findall(
                r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[(.*?)\]', block, re.DOTALL):
            lo_i = int(lo, 16)
            for idx, item in enumerate(re.findall(r'<([0-9A-Fa-f]+)>', arr)):
                table[lo_i + idx] = hex_to_text(item)
    return table


# --------------------------------------------------------------------------
#  Tokenizador de flujos de contenido
# --------------------------------------------------------------------------
TOKEN_RE = re.compile(rb"""
      (?P<ws>\s+)
    | (?P<str>\((?:\\.|[^\\()])*\))
    | (?P<hex><[0-9A-Fa-f\s]*>)
    | (?P<arr>\[|\])
    | (?P<name>/[^\s/\[\]<>(){}]*)
    | (?P<num>[-+]?(?:\d+\.?\d*|\.\d+))
    | (?P<op>[A-Za-z'"*][A-Za-z0-9*'"]*)
""", re.VERBOSE | re.DOTALL)

ESCAPES = {b'n': b'\n', b'r': b'\r', b't': b'\t', b'b': b'\b',
           b'f': b'\f', b'(': b'(', b')': b')', b'\\': b'\\'}


def unescape(literal):
    """Convierte el contenido de una cadena literal (...) a bytes."""
    out = bytearray()
    i = 0
    while i < len(literal):
        ch = literal[i:i + 1]
        if ch == b'\\' and i + 1 < len(literal):
            nxt = literal[i + 1:i + 2]
            if nxt in ESCAPES:
                out += ESCAPES[nxt]
                i += 2
                continue
            if nxt.isdigit():
                oct_digits = b''
                j = i + 1
                while j < len(literal) and len(oct_digits) < 3 and literal[j:j + 1].isdigit():
                    oct_digits += literal[j:j + 1]
                    j += 1
                out.append(int(oct_digits, 8) & 0xFF)
                i = j
                continue
            i += 2
            continue
        out += ch
        i += 1
    return bytes(out)


def decode_codes(raw, table, two_byte):
    """Traduce los codigos de glifo a texto usando la tabla /ToUnicode."""
    if table:
        step = 2 if two_byte else 1
        chars = []
        for i in range(0, len(raw) - step + 1, step):
            code = int.from_bytes(raw[i:i + step], 'big')
            chars.append(table.get(code, ''))
        return ''.join(chars)
    if two_byte:
        if len(raw) % 2:
            raw += b'\x00'
        try:
            return raw.decode('utf-16-be')
        except Exception:
            return ''
    return raw.decode('latin-1', 'replace')


# --------------------------------------------------------------------------
#  Extraccion del texto de una pagina
# --------------------------------------------------------------------------
def page_text(content, font_tables, font_two_byte):
    tokens = [(m.lastgroup, m.group(0)) for m in TOKEN_RE.finditer(content)
              if m.lastgroup != 'ws']
    out = []
    cur_font = None
    two_byte = True
    x = y = 0.0
    last_y = None
    leading = 12.0
    pending_numbers = []
    pending_name = None

    def show(raw, is_hex):
        nonlocal last_y
        table = font_tables.get(cur_font, {})
        if is_hex:
            h = re.sub(rb'[^0-9A-Fa-f]', b'', raw)
            if len(h) % 2:
                h = b'0' + h
            data = bytes.fromhex(h.decode('ascii')) if h else b''
        else:
            data = unescape(raw[1:-1])
        txt = decode_codes(data, table, two_byte)
        if not txt:
            return
        if last_y is None or abs(y - last_y) > 0.5:
            if out and not out[-1].endswith('\n'):
                out.append('\n')
            last_y = y
        out.append(txt)

    i = 0
    while i < len(tokens):
        kind, tok = tokens[i]
        nxt = tokens[i + 1] if i + 1 < len(tokens) else (None, b'')

        if kind == 'num':
            pending_numbers.append(float(tok))
            i += 1
            continue

        if kind == 'name':
            # El nombre puede ser el de la fuente activa (/F4 12 Tf).
            pending_name = tok[1:].decode('latin-1')
            i += 1
            continue

        if kind == 'str' or kind == 'hex':
            # Se guarda; el operador que sigue decide que hacer con el.
            if nxt[0] == 'op' and nxt[1] in (b'Tj', b"'", b'"'):
                if nxt[1] in (b"'", b'"'):
                    y -= leading
                show(tok, kind == 'hex')
                i += 2
                continue
            i += 1
            continue

        if kind == 'arr':
            if tok == b'[':
                # Arreglo de TJ: se muestran las cadenas; los numeros son
                # ajustes de separacion (los muy negativos, un espacio).
                j = i + 1
                parts = []
                while j < len(tokens) and not (tokens[j][0] == 'arr' and tokens[j][1] == b']'):
                    k, t = tokens[j]
                    if k == 'str':
                        parts.append((False, t))
                    elif k == 'hex':
                        parts.append((True, t))
                    elif k == 'num' and float(t) <= -200:
                        parts.append((None, b' '))
                    j += 1
                if j < len(tokens) and tokens[j][0] == 'arr' and tokens[j][1] == b']':
                    after = tokens[j + 1] if j + 1 < len(tokens) else (None, b'')
                    if after[0] == 'op' and after[1] in (b'TJ', b"'", b'"'):
                        for is_hex, item in parts:
                            if is_hex is None:
                                out.append(' ')
                            else:
                                show(item, is_hex)
                        i = j + 2
                        continue
                i += 1
                continue
            i += 1
            continue

        if kind == 'op':
            op = tok
            nums = pending_numbers
            if op == b'Tf' and pending_name is not None:
                cur_font = pending_name
                two_byte = font_two_byte.get(cur_font, True)
            elif op in (b'Td', b'TD'):
                if len(nums) >= 2:
                    x += nums[-2]
                    y += nums[-1]
                    if op == b'TD':
                        leading = -nums[-1]
            elif op == b'Tm':
                if len(nums) >= 6:
                    x = nums[-2]
                    y = nums[-1]
            elif op == b'T*':
                y -= leading
            elif op == b'ET':
                # Fin de un bloque de texto: en los PDF de Google Docs cada
                # palabra viene en su propio bloque, asi que se separa con un
                # espacio. Los saltos de linea los decide el cambio de altura.
                if out and not out[-1].endswith((' ', '\n')):
                    out.append(' ')
            pending_numbers = []
            pending_name = None
            i += 1
            continue

        i += 1

    text = ''.join(out)
    text = re.sub(r'[ \t]+\n', '\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# --------------------------------------------------------------------------
#  Recorrido del documento
# --------------------------------------------------------------------------
def extract(path):
    with open(path, 'rb') as fh:
        data = fh.read()
    objs = parse_objects(data)

    # Orden de paginas por numero de objeto (suficiente para estos PDF).
    pages = sorted(num for num, obj in objs.items()
                   if re.search(rb'/Type\s*/Page\b', obj['body']))

    tables_by_font = {}

    def font_table(fnum):
        """Tabla de traduccion (codigo de glifo -> caracter) de una fuente."""
        if fnum not in tables_by_font:
            fbody = objs.get(fnum, {}).get('body', b'')
            tuni = ref_of(fbody, '/ToUnicode')
            blob = objs.get(tuni, {}).get('stream') if tuni else None
            tables_by_font[fnum] = parse_tounicode(blob) if blob else {}
        return tables_by_font[fnum]

    chunks = []
    for idx, num in enumerate(pages, start=1):
        body = objs[num]['body']

        contents = refs_of(body, '/Contents')
        if not contents:
            single = ref_of(body, '/Contents')
            contents = [single] if single else []
        blob = b''
        for c in contents:
            stream = objs.get(c, {}).get('stream')
            if stream:
                blob += stream + b'\n'
        if not blob:
            continue

        font_tables = {}
        font_two_byte = {}
        for name, fnum in fonts_of(body).items():
            fbody = objs.get(fnum, {}).get('body', b'')
            font_tables[name] = font_table(fnum)
            # Las fuentes Type0 (Identity-H) usan codigos de 2 bytes;
            # las fuentes simples (WinAnsi), de 1 byte.
            font_two_byte[name] = bool(re.search(rb'/Subtype\s*/Type0', fbody))

        chunks.append('===== PAGINA %d =====\n%s'
                      % (idx, page_text(blob, font_tables, font_two_byte)))
    return '\n'.join(chunks)


def main():
    ap = argparse.ArgumentParser(description='Extrae el texto de un PDF (solo libreria estandar).')
    ap.add_argument('pdf', help='ruta del archivo PDF')
    ap.add_argument('-o', '--out', help='archivo .txt de salida (opcional)')
    args = ap.parse_args()

    try:
        text = extract(args.pdf)
    except Exception as exc:
        print('ERROR al leer el PDF: %s' % exc, file=sys.stderr)
        return 1

    if not text.strip():
        print('No se encontro texto. Puede ser un PDF escaneado (solo imagenes).', file=sys.stderr)

    if args.out:
        with open(args.out, 'w', encoding='utf-8') as fh:
            fh.write(text)
        print('Texto guardado en %s (%d caracteres)' % (args.out, len(text)))
    else:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        print(text)
    return 0


if __name__ == '__main__':
    sys.exit(main())
