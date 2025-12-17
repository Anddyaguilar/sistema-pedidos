import db from "../db";

export async function insertProducts(productos, idProveedor = null) {
  const sql = `
    INSERT INTO productos
    (nombre_producto, codigo_original, precio, id_proveedor)
    VALUES (?, ?, ?, ?)
  `;

  for (const p of productos) {
    if (!p.nombre_producto || !p.precio) continue;

    await db.execute(sql, [
      p.nombre_producto,
      p.codigo_original || "default_value",
      p.precio,
      idProveedor
    ]);
  }
}
