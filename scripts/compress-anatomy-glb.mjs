import { MeshoptEncoder } from "meshoptimizer";

/** EXT_meshopt_compression, with a placeholder fallback buffer per the spec. */
export async function compressAnatomyGlb(data) {
  await MeshoptEncoder.ready;
  const bytes = Buffer.from(data),
    jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const binaryOffset = 20 + jsonLength + 8,
    binary = bytes.subarray(binaryOffset);
  const chunks = [];
  let offset = 0;
  function append(chunk) {
    const at = offset,
      buffer = Buffer.from(chunk);
    chunks.push(buffer);
    offset += buffer.length;
    const pad = (4 - (offset % 4)) % 4;
    if (pad) {
      chunks.push(Buffer.alloc(pad));
      offset += pad;
    }
    return at;
  }
  for (let i = 0; i < gltf.bufferViews.length; i++) {
    const view = gltf.bufferViews[i],
      source = new Uint8Array(
        binary.buffer,
        binary.byteOffset + (view.byteOffset ?? 0),
        view.byteLength,
      );
    const accessor = gltf.accessors.find((a) => a.bufferView === i);
    if (view.target === 34962 || view.target === 34963) {
      const mode = view.target === 34963 ? "TRIANGLES" : "ATTRIBUTES";
      const stride =
        view.byteStride ?? (accessor.componentType === 5125 ? 4 : 2);
      const count = source.length / stride;
      if (!Number.isInteger(count))
        throw new Error("Invalid anatomical buffer stride");
      const encoded = MeshoptEncoder.encodeGltfBuffer(
          source,
          count,
          stride,
          mode,
          0,
        ),
        start = append(encoded);
      view.buffer = 1;
      view.extensions = {
        ...view.extensions,
        EXT_meshopt_compression: {
          buffer: 0,
          byteOffset: start,
          byteLength: encoded.length,
          byteStride: stride,
          count,
          mode,
          filter: "NONE",
        },
      };
    } else {
      view.buffer = 0;
      view.byteOffset = append(source);
    }
  }
  gltf.buffers = [
    { byteLength: offset },
    {
      byteLength: gltf.buffers[0].byteLength,
      extensions: { EXT_meshopt_compression: { fallback: true } },
    },
  ];
  gltf.extensionsUsed = [
    ...new Set([...(gltf.extensionsUsed ?? []), "EXT_meshopt_compression"]),
  ];
  gltf.extensionsRequired = [
    ...new Set([...(gltf.extensionsRequired ?? []), "EXT_meshopt_compression"]),
  ];
  let json = Buffer.from(JSON.stringify(gltf)),
    pad = (4 - (json.length % 4)) % 4;
  if (pad) json = Buffer.concat([json, Buffer.alloc(pad, 0x20)]);
  const bin = Buffer.concat(chunks),
    result = Buffer.alloc(12 + 8 + json.length + 8 + bin.length);
  result.writeUInt32LE(0x46546c67, 0);
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(json.length, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  json.copy(result, 20);
  const at = 20 + json.length;
  result.writeUInt32LE(bin.length, at);
  result.writeUInt32LE(0x004e4942, at + 4);
  bin.copy(result, at + 8);
  return result;
}
