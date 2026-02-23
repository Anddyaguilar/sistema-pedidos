import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '../style/style.css';
import { Pencil, Trash } from 'react-bootstrap-icons';

const API_BASE_URL = 'http://localhost:5001';

// =============================================
// COMPONENTE MODAL PARA EDITAR PRODUCTO
// =============================================
const EditProductModal = ({
  product,
  providers,
  onClose,
  onSave,
  formData,
  onFormChange,
  isSubmitting
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Editar Producto #{product?.id_producto}</h3>
        <div className="form-group">
          <label>Nombre del Producto:</label>
          <input
            type="text"
            name="nombre_producto"
            value={formData.nombre_producto}
            onChange={onFormChange}
          />
        </div>
        <div className="form-group">
          <label>Código Original:</label>
          <input
            type="text"
            name="codigo_original"
            value={formData.codigo_original}
            onChange={onFormChange}
          />
        </div>
        <div className="form-group">
          <label>Proveedor:</label>
          <select
            name="id_proveedor"
            value={formData.id_proveedor}
            onChange={onFormChange}
          >
            {(providers || []).map(provider => (
              <option key={provider.id_proveedor} value={provider.id_proveedor}>
                {provider.nombre_proveedor}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Precio:</label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={onFormChange}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label>Moneda:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="moneda"
                value="C$"
                checked={formData.moneda === 'C$'}
                onChange={onFormChange}
              />
              <span>Córdobas (C$)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="moneda"
                value="$"
                checked={formData.moneda === '$'}
                onChange={onFormChange}
              />
              <span>Dólares ($)</span>
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="btn-confirm"
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Actualizando...
              </>
            ) : 'Actualizar Producto'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-cancel"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// COMPONENTE MODAL PARA NUEVO PRODUCTO
// =============================================
const NewProductModal = ({
  providers,
  onClose,
  onSave,
  formData,
  onFormChange,
  isSubmitting,
  onImageUpload,
  ocrPreview,
  loadingImage,
  productosDetectados,
  onDetectedProductsChange,
  onInsertDetectedProducts
}) => {
  // Manejar cambios en los campos de productos detectados por OCR
  const handleDetectedChange = (index, field, value) => {
    const updated = [...productosDetectados];

    // Convertir a número solo el precio
    if (field === 'precio') {
      const numValue = parseFloat(value);
      updated[index][field] = isNaN(numValue) ? 0 : numValue;
    } else {
      updated[index][field] = value;
    }

    onDetectedProductsChange(updated);
  };
  const [tasaCambio, setTasaCambio] = useState(36.6); // Valor por defecto
  useEffect(() => {
    const fetchTasaCambio = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/config");
        if (response.ok) {
          const data = await response.json();
          if (data?.config?.exchange_rate) {
            setTasaCambio(Number(data.config.exchange_rate));
          }
        }
      } catch (error) {
        console.warn("No se pudo cargar la tasa de cambio, usando valor por defecto:", error);
        // Mantener el valor por defecto
      }
    };
    fetchTasaCambio();
  }, []);
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Nuevo Producto</h3>

        {/* SELECT PRINCIPAL DE PROVEEDOR */}
        <div className="form-group">
          <label>Proveedor:</label>
          <select
            name="id_proveedor"
            value={formData.id_proveedor || ''}
            onChange={e => {
              const proveedorId = e.target.value;
              // actualizar form principal
              onFormChange(e);

              // aplicar proveedor a TODOS los productos detectados
              const updated = (productosDetectados || []).map(prod => ({
                ...prod,
                id_proveedor: proveedorId
              }));

              onDetectedProductsChange(updated);
            }}
          >
            <option value="">Seleccionar proveedor</option>
            {(providers || []).map(provider => (
              <option
                key={provider.id_proveedor}
                value={provider.id_proveedor}
              >
                {provider.nombre_proveedor}
              </option>
            ))}
          </select>
        </div>

        {/* SELECTOR DE MONEDA */}
        <div className="form-group">
          <label>Moneda:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="moneda"
                value="C$"
                checked={formData.moneda === 'C$'}
                onChange={e => {
                  onFormChange(e);
                  // Aplicar la moneda seleccionada a todos los productos detectados
                  const updated = (productosDetectados || []).map(prod => ({
                    ...prod,
                    moneda: e.target.value
                  }));
                  onDetectedProductsChange(updated);
                }}
              />
              <span>Córdobas (C$)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="moneda"
                value="$"
                checked={formData.moneda === '$'}
                onChange={e => {
                  onFormChange(e);
                  // Aplicar la moneda seleccionada a todos los productos detectados
                  const updated = (productosDetectados || []).map(prod => ({
                    ...prod,
                    moneda: e.target.value
                  }));
                  onDetectedProductsChange(updated);
                }}
              />
              <span>Dólares ($)</span>
            </label>
          </div>
        </div>
        {/* Info de tasa de cambio */}
        <div className="tasa-info" >
          Tasa de cambio: 1$ = C${tasaCambio.toFixed(2)}
        </div>
        {/* SUBIR IMAGEN */}
        <div className="form-group">
          <label>Extraer datos desde imagen:</label>
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            disabled={loadingImage}
          />
        </div>

        {/* LOADING */}
        {loadingImage && (
          <div className="loading-message">
            <p>Procesando imagen... <span className="spinner"></span></p>
          </div>
        )}

        {/* PRODUCTOS DETECTADOS */}
        {productosDetectados && productosDetectados.length > 0 && (
          <div className="detected-products-preview">
            <h4>Productos detectados - revisa antes de insertar</h4>

            <div className="table-responsive">
              <table className="ocr-detected-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Moneda</th>
                    <th>Proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {productosDetectados.map((prod, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          className="ocr-input"
                          value={prod.codigo_original || ''}
                          onChange={e =>
                            handleDetectedChange(
                              idx,
                              'codigo_original',
                              e.target.value
                            )
                          }
                          placeholder="Código"
                        />
                      </td>

                      <td>
                        <input
                          className="ocr-input"
                          value={prod.nombre_producto || ''}
                          onChange={e =>
                            handleDetectedChange(
                              idx,
                              'nombre_producto',
                              e.target.value
                            )
                          }
                          placeholder="Nombre"
                        />
                      </td>

                      <td>
                        <input
                          className="ocr-input"
                          type="number"
                          value={prod.precio || ''}
                          onChange={e =>
                            handleDetectedChange(
                              idx,
                              'precio',
                              e.target.value
                            )
                          }
                          placeholder="Precio"
                          min="0"
                          step="0.01"
                        />
                      </td>

                      {/* MONEDA - BLOQUEADO (toma el radio button principal) */}
                      <td>
                        <div className="radio-group-small">
                          <label>
                            <input
                              type="radio"
                              name={`moneda-${idx}`}
                              value="C$"
                              checked={prod.moneda === 'C$'}
                              disabled
                            />
                            C$
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`moneda-${idx}`}
                              value="$"
                              checked={prod.moneda === '$'}
                              disabled
                            />
                            $
                          </label>
                        </div>
                      </td>

                      {/* PROVEEDOR BLOQUEADO – TOMA EL SELECT PRINCIPAL */}
                      <td>
                        <select
                          className="ocr-select"
                          value={formData.id_proveedor || ''}
                          disabled
                        >
                          {(providers || []).map(provider => (
                            <option
                              key={provider.id_proveedor}
                              value={provider.id_proveedor}
                            >
                              {provider.nombre_proveedor}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          </div>
        )}

        {/* ACCIONES MODAL */}
        <div className="modal-actions">
          <button
            onClick={onInsertDetectedProducts}
            className="btn-confirm-modal"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Insertando...
              </>
            ) : (
              `Insertar ${productosDetectados.length} productos`
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-cancel"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// COMPONENTE MODAL PARA ORDENES
// =============================================
const OrderModal = ({
  groupedOrders,
  onClose,
  onCreateOrders,
  isSubmitting
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Resumen de Pedidos por Proveedor</h3>
        <div className="modal-scroll">
          {Object.entries(groupedOrders || {}).map(([providerId, data]) => (
            <div key={providerId} className="provider-order">
              <h4>Proveedor: {data?.providerName || 'Desconocido'}</h4>
              <table className="order-details">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item?.productName || 'Sin nombre'}</td>
                      <td>{item?.quantity || 0}</td>
                      <td>C${(item?.price || 0).toFixed(2)}</td>
                      <td>C${((item?.price || 0) * (item?.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="total-label">Total:</td>
                    <td className="total-value">C${(data?.total || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button
            onClick={onCreateOrders}
            disabled={isSubmitting}
            className="btn-confirm"
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Procesando...
              </>
            ) : 'Confirmar Pedidos'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-cancel"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// COMPONENTE PRINCIPAL PRODUCTLIST
// =============================================
const ProductList = () => {
  const searchInputRef = useRef(null);

  // ================= ESTADOS =================
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [selectedItems, setSelectedItems] = useState({});
  const [groupedOrders, setGroupedOrders] = useState({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const [tasaCambio, setTasaCambio] = useState(36.6);

  // Estados para OCR
  const [ocrPreview, setOcrPreview] = useState('');
  const [loadingImage, setLoadingImage] = useState(true);
  const [productosDetectados, setProductosDetectados] = useState([]);

  const [formData, setFormData] = useState({
    nombre_producto: '',
    codigo_original: '',
    id_proveedor: '',
    precio: '',
    stock: '',
    tipo_moneda: 'C$',
    moneda: 'C$'
  });

  const itemsPerPage = 50;

  // ================= CARGAR TASA =================
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/config`);
        if (res.data?.config?.exchange_rate) {
          setTasaCambio(Number(res.data.config.exchange_rate));
        }
      } catch {
        console.warn('Usando tasa por defecto');
      }
    };
    loadConfig();
  }, []);

  // ================= CONVERTIR PRECIOS =================
  const convertirPrecios = (precio, tipo) => {
    const p = Number(precio) || 0;
    if (tipo === 'C$') {
      return {
        cordoba: p,
        dolar: Number((p / tasaCambio).toFixed(2))
      };
    }
    return {
      cordoba: Number((p * tasaCambio).toFixed(2)),
      dolar: p
    };
  };

  // ================= FETCH DATA =================
  const fetchData = async (search = '', page = 1) => {
    setLoading(true);
    try {
      const [prodRes, provRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/productos`, {
          params: { search, page, limit: itemsPerPage }
        }),
        axios.get(`${API_BASE_URL}/api/proveedores`)
      ]);

      setProducts(prodRes.data?.productos || []);
      setTotalProducts(prodRes.data?.total || 0);
      setTotalPages(prodRes.data?.totalPages || 1);
      setProviders(provRes.data || []);

      if (provRes.data?.length && !formData.id_proveedor) {
        setFormData(f => ({ ...f, id_proveedor: provRes.data[0].id_proveedor }));
      }

      setError(null);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(searchTerm, currentPage);
  }, [currentPage]);

  // ================= BUSCAR =================
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 2) {
        fetchData(searchTerm, 1);
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ================= UTIL =================
  const getProviderName = (id) => {
    const p = providers.find(x => x.id_proveedor === id);
    return p ? p.nombre_proveedor : 'Proveedor desconocido';
  };

  // ================= PEDIDOS =================
  useEffect(() => {
    const grouped = {};
    Object.values(selectedItems).forEach(item => {
      if (!item || !item.providerId) return;

      if (!grouped[item.providerId]) {
        grouped[item.providerId] = {
          items: [],
          total: 0,
          providerName: getProviderName(item.providerId)
        };
      }
      grouped[item.providerId].items.push(item);
      grouped[item.providerId].total += (item.quantity || 0) * (item.price || 0);
    });
    setGroupedOrders(grouped);
  }, [selectedItems, providers]);

  const handleQuantityChange = (productId, qty) => {
    const quantity = Math.max(0, Number(qty) || 0);

    setSelectedItems(prev => {
      const updated = { ...prev };
      if (quantity === 0) {
        delete updated[productId];
      } else {
        const p = products.find(x => x.id_producto === productId);
        if (p) {
          // Usar precio en córdobas para los pedidos
          const precios = convertirPrecios(p.precio, p.tipo_moneda);
          updated[productId] = {
            productId: p.id_producto,
            quantity,
            providerId: p.id_proveedor,
            price: precios.cordoba, // Siempre usar córdobas para pedidos
            productName: p.nombre_producto,
            id_producto: p.id_producto // Asegurar que tenemos el id del producto
          };
        }
      }
      return updated;
    });
  };

  // =============================================
  // FUNCIÓN PARA CREAR PEDIDOS
  // =============================================
  const handleCreateOrders = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token. Inicia sesión.');

      const fecha = new Date().toISOString().split('T')[0];

      // Crear pedidos para cada proveedor
      for (const providerId of Object.keys(groupedOrders)) {
        const items = groupedOrders[providerId].items;

        // Construir detalles del pedido
        const detalles = items.map(item => ({
          id_producto: Number(item.productId || item.id_producto),
          cantidad: Number(item.quantity),
          precio_unitario: Number(item.price)
        }));

        // Validar detalles
        const detallesValidos = detalles.filter(
          d =>
            Number.isInteger(d.id_producto) &&
            d.id_producto > 0 &&
            !isNaN(d.cantidad) &&
            d.cantidad > 0 &&
            !isNaN(d.precio_unitario) &&
            d.precio_unitario > 0
        );

        if (detallesValidos.length === 0) {
          throw new Error(`Proveedor ${providerId} sin productos válidos`);
        }

        const payload = {
          id_proveedor: Number(providerId),
          fecha_pedido: fecha,
          detalles: detallesValidos
        };

        console.log('📤 Creando pedido para proveedor:', providerId);
        console.log('📤 Payload:', payload);

        const response = await axios.post(
          `${API_BASE_URL}/api/pedidos`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ Pedido creado:', response.data);
      }

      alert(`✅ ${Object.keys(groupedOrders).length} pedido(s) creado(s) correctamente`);

      // Limpiar selección
      setSelectedItems({});
      setGroupedOrders({});
      setShowOrderModal(false);

    } catch (error) {
      console.error('❌ ERROR al crear pedidos:', error.response?.data || error.message);

      let errorMessage = 'Error al crear pedido(s)';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= CRUD =================
  const handleNewProduct = () => {
    setCurrentProduct(null);
    setFormData({
      nombre_producto: '',
      codigo_original: '',
      id_proveedor: providers[0]?.id_proveedor || '',
      precio: '',
      stock: '',
      tipo_moneda: 'C$',
      moneda: 'C$'
    });
    setProductosDetectados([]);
    setOcrPreview('');
    setShowNewModal(true);
  };

  const handleEditProduct = (p) => {
    if (!p) return;

    setCurrentProduct(p);
    setFormData({
      nombre_producto: p.nombre_producto || '',
      codigo_original: p.codigo_original || '',
      id_proveedor: p.id_proveedor || '',
      precio: p.precio || '',
      stock: p.stock || '',
      tipo_moneda: p.tipo_moneda || 'C$',
      moneda: p.tipo_moneda || 'C$'
    });
    setShowEditModal(true);
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const saveProduct = async () => {
    if (!formData.nombre_producto || !formData.codigo_original) {
      alert('Faltan datos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentProduct) {
        await axios.put(`${API_BASE_URL}/api/productos/${currentProduct.id_producto}`, {
          ...formData,
          tipo_moneda: formData.moneda
        });
        alert('✅ Producto actualizado correctamente');
        setShowEditModal(false);
      } else {
        await axios.post(`${API_BASE_URL}/api/productos`, {
          ...formData,
          tipo_moneda: formData.moneda
        });
        alert('✅ Producto creado correctamente');
        setShowNewModal(false);
      }
      fetchData(searchTerm, currentPage);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(`❌ Error al guardar producto: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/productos/${id}`);
      alert('✅ Producto eliminado correctamente');
      fetchData(searchTerm, currentPage);
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert(`❌ Error al eliminar producto: ${error.response?.data?.message || error.message}`);
    }
  };

  // ================= FUNCIONES OCR =================
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingImage(true);
    setOcrPreview('');
    setProductosDetectados([]);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_BASE_URL}/api/ocr/extract`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setOcrPreview(response.data?.text || 'No se pudo extraer texto');

      // Procesar productos detectados
      if (response.data?.products || response.data?.productos) {
        const productos = response.data.products || response.data.productos;
        setProductosDetectados(productos);
        alert(`✅ ${productos.length} productos detectados en la imagen`);
      }
    } catch (error) {
      console.error('Error en OCR:', error);
      alert('❌ Error al procesar la imagen');
      setOcrPreview('Error al procesar imagen');
    } finally {
      setLoadingImage(false);
    }
  };

  const handleInsertDetectedProducts = async () => {
    if (productosDetectados.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const prod of productosDetectados) {
        const productoData = {
          nombre_producto: prod.nombre_producto || '',
          codigo_original: prod.codigo_original || '',
          id_proveedor: formData.id_proveedor || prod.id_proveedor || '',
          precio: prod.precio || 0,
          tipo_moneda: formData.moneda || 'C$'
        };

        await axios.post(`${API_BASE_URL}/api/productos`, productoData);
      }

      alert(`✅ ${productosDetectados.length} productos insertados correctamente`);
      setProductosDetectados([]);
      setOcrPreview('');
      setShowNewModal(false);
      fetchData(searchTerm, currentPage);
    } catch (error) {
      console.error('Error al insertar productos:', error);
      alert('❌ Error al insertar algunos productos');
    } finally {
      setIsSubmitting(false);
    }
  };
   const rolUsuario = localStorage.getItem("rol"); // "admin" o "user"

  // ================= RENDER =================
 /* if (loading && products.length === 0) {
    return <div className="loading-container">Cargando productos...</div>;
  }*/

  return (
    <div className="order-list">
      <div className='container-t1'>
        <h2>Lista de Productos</h2>

        <div className="search-container">
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nombre o proveedor..."
            className="search-input"
          />
          <span className="total-products">
            {totalProducts} Productos
          </span>
          <button onClick={handleNewProduct} className="btn-add">
            Nuevo  ➕
          </button>
        </div>

        {/* RESUMEN DE PEDIDOS */}
        {Object.keys(selectedItems).length > 0 && (
          <div className="order-summary">
            <button
              className="btn-create-order"
              onClick={() => setShowOrderModal(true)}
            >
              Generar Pedidos ( {Object.keys(selectedItems).length} productos )
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {products.length === 0 && !loading ? (
        <div className="no-results">No se encontraron productos</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="product-table">
              <thead>
                <tr>
                  <th width="25px">✔</th>
                  <th width="50px">#</th>
                  <th width="100px">Código</th>
                  <th>Nombre</th>
                  <th>Proveedor</th>
                  <th width="100px">Precio C$</th>
                  <th width="100px">Precio $</th>
                  <th width="120px">Cantidad</th>
                  <th width="180px">Acciones</th>
                  <th >Fecha</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const precios = convertirPrecios(p.precio, p.tipo_moneda);
                  const isSel = !!selectedItems[p.id_producto];
                  const qty = isSel ? selectedItems[p.id_producto]?.quantity || 0 : 0;

                  return (
                    <tr key={p.id_producto} className={isSel ? "selected-row" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={e => handleQuantityChange(p.id_producto, e.target.checked ? 1 : 0)}
                          className="select-checkbox"
                        />
                      </td>
                      <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                      <td>
                        <a
                          href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(p.codigo_original)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'blue', textDecoration: 'underline' }}
                        >
                          {p.codigo_original}
                        </a>
                      </td>
                      <td>{p.nombre_producto}</td>
                      <td>{getProviderName(p.id_proveedor)}</td>
                      <td>C${precios.cordoba.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>${precios.dolar.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          disabled={!isSel}
                          onChange={e => handleQuantityChange(p.id_producto, e.target.value)}
                          className="quantity-input"
                        />
                      </td>
                      <td>

                        <button
                          onClick={() => handleEditProduct(p)}
                          className="btn-edit"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {rolUsuario === "admin" && (
                          <button
                            onClick={() => handleDeleteProduct(p.id_producto)}
                            className="btn-delete"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        )}

                      </td>
                      <td>{new Date(p.fecha_creacion).toLocaleDateString('es-NI')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  &lsaquo;
                </button>
                <span className="pagination-info">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  &rsaquo;
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALES */}
      {showNewModal && (
        <NewProductModal
          providers={providers}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={saveProduct}
          onClose={() => setShowNewModal(false)}
          isSubmitting={isSubmitting}
          onImageUpload={handleImageUpload}
          ocrPreview={ocrPreview}
          loadingImage={loadingImage}
          productosDetectados={productosDetectados}
          onDetectedProductsChange={setProductosDetectados}
          onInsertDetectedProducts={handleInsertDetectedProducts}
        />
      )}

      {showEditModal && currentProduct && (
        <EditProductModal
          product={currentProduct}
          providers={providers}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={saveProduct}
          onClose={() => setShowEditModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {showOrderModal && (
        <OrderModal
          groupedOrders={groupedOrders}
          onClose={() => setShowOrderModal(false)}
          onCreateOrders={handleCreateOrders}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default ProductList;