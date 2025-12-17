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
        <h3>Editar Producto #{product.id_producto}</h3>
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
            {providers.map(provider => (
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
  // Propósito: Manejar cambios en los campos de productos detectados por OCR
  const handleDetectedChange = (index, field, value) => {
    const updated = [...productosDetectados];

    // Convertir a número si es precio o id_proveedor
    if (field === 'precio' || field === 'id_proveedor') {
      const numValue = parseFloat(value);
      updated[index][field] = isNaN(numValue) ? 0 : numValue;
    } else {
      updated[index][field] = value;
    }

    onDetectedProductsChange(updated);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Nuevo Producto</h3>

        <div className="form-group">
          <label>Proveedor:</label>
          <select
            name="id_proveedor"
            value={formData.id_proveedor}
            onChange={onFormChange}
          >
            {providers.map(provider => (
              <option key={provider.id_proveedor} value={provider.id_proveedor}>
                {provider.nombre_proveedor}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Extraer datos desde imagen:</label>
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            disabled={loadingImage}
          />
        </div>

        {ocrPreview && (
          <div className="ocr-preview">
            <label>Texto OCR extraído:</label>
            <pre>{ocrPreview}</pre>
          </div>
        )}

        {loadingImage && (
          <div className="loading-message">
            <p>Procesando imagen... <span className="spinner"></span></p>
          </div>
        )}

        {productosDetectados.length > 0 && (
          <div className="detected-products-preview">
            <h4>Productos detectados - revisa antes de insertar</h4>
            <div className="table-responsive">
              <table className="ocr-detected-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Precio</th>
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
                          onChange={e => handleDetectedChange(idx, 'codigo_original', e.target.value)}
                          placeholder="Código"
                        />
                      </td>
                      <td>
                        <input
                          className="ocr-input"
                          value={prod.nombre_producto || ''}
                          onChange={e => handleDetectedChange(idx, 'nombre_producto', e.target.value)}
                          placeholder="Nombre"
                        />
                      </td>
                      <td>
                        <input
                          className="ocr-input"
                          type="number"
                          value={prod.precio || ''}
                          onChange={e => handleDetectedChange(idx, 'precio', e.target.value)}
                          placeholder="Precio"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <select
                          className="ocr-select"
                          value={prod.id_proveedor || ''}
                          onChange={e => handleDetectedChange(idx, 'id_proveedor', e.target.value)}
                        >
                          <option value="">Seleccionar proveedor</option>
                          {providers.map(provider => (
                            <option key={provider.id_proveedor} value={provider.id_proveedor}>
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
            <div className="ocr-actions">
              <button
                onClick={onInsertDetectedProducts}
                className="btn-confirm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Insertando...
                  </>
                ) : `Insertar ${productosDetectados.length} productos`}
              </button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="btn-confirm"
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Creando...
              </>
            ) : 'Crear Producto'}
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
          {Object.entries(groupedOrders).map(([providerId, data]) => (
            <div key={providerId} className="provider-order">
              <h4>Proveedor: {data.providerName}</h4>
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
                  {data.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="total-label">Total:</td>
                    <td className="total-value">${data.total.toFixed(2)}</td>
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
  // ========== REFERENCIAS ==========
  const searchInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ========== ESTADOS PRINCIPALES ==========
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
  const [ocrPreview, setOcrPreview] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
  const [productosDetectados, setProductosDetectados] = useState([]);

  const [formData, setFormData] = useState({
    nombre_producto: '',
    codigo_original: '',
    id_proveedor: '',
    precio: '',
    stock: ''
  });

  // ========== CONFIGURACIÓN ==========
  const itemsPerPage = 50;

  // ========== FUNCIÓN PARA PROCESAR IMAGEN POR OCR ==========
  // En tu componente React
  // =============================================
  // FUNCIÓN CORREGIDA PARA PROCESAR IMAGEN POR OCR
  // =============================================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingImage(true);
    setProductosDetectados([]); // limpiar anteriores

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5001/api/ocr/extract', { // asegúrate del puerto
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Gemini devuelve JSON con productos
      if (data.productos && Array.isArray(data.productos)) {
        setProductosDetectados(data.productos);
      } else {
        alert('❌ No se detectaron productos en la imagen');
      }
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      alert('❌ Error al procesar la imagen con Gemini');
    } finally {
      setLoadingImage(false);
    }
  };



  // Función para guardar productos detectados (si decides usarla)
  const handlesave = async () => {
    if (!productosDetectados || productosDetectados.length === 0) {
      alert('⚠️ No hay productos para guardar');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/productos/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          products: productosDetectados
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Resultado guardado:', result);
      alert('✅ Productos guardados exitosamente');
      setProductosDetectados([]);
      setOcrPreview('');
      setShowNewModal(false);
      fetchData(searchTerm, currentPage);

    } catch (error) {
      console.error('Error al guardar productos:', error);
      alert('❌ Error al guardar productos');
    }
  };


  // ========== FUNCIÓN PARA INSERTAR PRODUCTOS DETECTADOS POR OCR ==========
  const handleInsertDetectedProducts = async () => {
    if (!productosDetectados || productosDetectados.length === 0) {
      alert('⚠️ No hay productos para insertar');
      return;
    }

    // Validación estricta
    const productosInvalidos = productosDetectados.filter(prod =>
      !prod.codigo_original ||
      !prod.nombre_producto ||
      !prod.id_proveedor
    );

    if (productosInvalidos.length > 0) {
      alert(`⚠️ ${productosInvalidos.length} productos tienen datos incompletos`);
      console.table(productosInvalidos);
      return;
    }

    setIsSubmitting(true);

    try {
      const responses = await Promise.all(
        productosDetectados.map(prod =>
          axios.post(`${API_BASE_URL}/api/productos`, {
            nombre_producto: prod.nombre_producto.trim(),
            codigo_original: prod.codigo_original.trim(),
            id_proveedor: Number(prod.id_proveedor),
            precio: Number(prod.precio) || 0,
            stock: Number(prod.stock) || 0
          })
        )
      );

      const insertados = responses.filter(
        r => r.status === 200 || r.status === 201
      ).length;

      alert(`✅ ${insertados} productos insertados correctamente`);

      // Limpieza
      setProductosDetectados([]);
      setOcrPreview('');
      setShowNewModal(false);

      fetchData(searchTerm, currentPage);

    } catch (error) {
      console.error('Error al insertar:', error);
      alert(
        error.response?.data?.message ||
        '❌ Error al insertar productos'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== FUNCIÓN PRINCIPAL PARA CARGAR DATOS ==========
  const fetchData = async (searchValue, page) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const [productsRes, providersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/productos`, {
          params: {
            page: page || currentPage,
            limit: itemsPerPage,
            search: searchValue || searchTerm
          },
          signal: abortControllerRef.current.signal
        }),
        axios.get(`${API_BASE_URL}/api/proveedores`, {
          signal: abortControllerRef.current.signal
        })
      ]);

      setProducts(productsRes.data.productos || []);
      setTotalProducts(productsRes.data.total || 0);
      setTotalPages(productsRes.data.totalPages || 1);
      setProviders(providersRes.data);
      setError(null);

      // Si es la primera carga y no hay proveedor seleccionado, seleccionar el primero
      if (providersRes.data.length > 0 && !formData.id_proveedor) {
        setFormData(prev => ({
          ...prev,
          id_proveedor: providersRes.data[0].id_proveedor
        }));
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ========== EFECTO PARA BÚSQUEDA CON DEBOUNCE ==========
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Guardar la posición del cursor
    const cursorPosition = searchInputRef.current?.selectionStart;

    debounceTimeoutRef.current = setTimeout(() => {
      fetchData(searchTerm, 1);

      // Restaurar cursor
      if (searchInputRef.current && cursorPosition !== null) {
        searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        searchInputRef.current.focus();
      }
    }, 350);

    return () => {
      clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchTerm]);

  // ========== EFECTO PARA CAMBIOS DE PÁGINA ==========
  useEffect(() => {
    fetchData(searchTerm, currentPage);
  }, [currentPage]);

  // ========== EFECTO PARA AGRUPAR PEDIDOS ==========
  useEffect(() => {
    const grouped = {};
    Object.values(selectedItems).forEach(item => {
      if (!grouped[item.providerId]) {
        grouped[item.providerId] = {
          providerName: getProviderName(item.providerId),
          items: [],
          total: 0
        };
      }
      grouped[item.providerId].items.push(item);
      grouped[item.providerId].total += item.quantity * item.price;
    });
    setGroupedOrders(grouped);
  }, [selectedItems, providers]);

  // ========== FUNCIÓN PARA OBTENER NOMBRE DE PROVEEDOR ==========
  const getProviderName = (id) => {
    const provider = providers.find(p => p.id_proveedor === id);
    return provider ? provider.nombre_proveedor : "Proveedor desconocido";
  };

  // ========== MANEJADOR DE CAMBIOS EN CANTIDAD ==========
  const handleQuantityChange = (productId, quantity) => {
    const numQuantity = Math.max(0, parseInt(quantity) || 0);
    setSelectedItems(prev => {
      const updated = { ...prev };
      if (numQuantity <= 0) {
        delete updated[productId];
      } else {
        const product = products.find(p => p.id_producto === productId);
        if (product) {
          updated[productId] = {
            productId,
            quantity: numQuantity,
            providerId: product.id_proveedor,
            productName: product.nombre_producto,
            price: product.precio,
            providerName: getProviderName(product.id_proveedor)
          };
        }
      }
      return updated;
    });
  };

  // ========== FUNCIÓN PARA CREAR PEDIDOS ==========
  const createOrders = async () => {
    setIsSubmitting(true);
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const results = await Promise.all(
        Object.keys(groupedOrders).map(providerId => {
          const detalles = groupedOrders[providerId].items.map(item => ({
            id_producto: item.productId,
            cantidad: item.quantity,
            precio_unitario: item.price
          }));
          return axios.post(`${API_BASE_URL}/api/pedidos`, {
            id_proveedor: Number(providerId),
            fecha_pedido: fecha,
            detalles
          });
        })
      );
      alert(`✅ ${results.length} pedido(s) creados exitosamente`);
      setSelectedItems({});
      setGroupedOrders({});
      setShowOrderModal(false);
      fetchData(searchTerm, currentPage);
    } catch (error) {
      alert(`❌ Error al crear pedidos: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== MANEJADOR DE CAMBIOS EN BÚSQUEDA ==========
  const handleSearchChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setSearchTerm(value);

    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.selectionStart = cursorPosition;
        searchInputRef.current.selectionEnd = cursorPosition;
      }
    }, 0);
  };

  // ========== FUNCIONES PARA MODALES ==========
  const handleNewProduct = () => {
    setCurrentProduct(null);
    setFormData({
      nombre_producto: '',
      codigo_original: '',
      id_proveedor: providers.length > 0 ? providers[0].id_proveedor : '',
      precio: '',
      stock: ''
    });
    setProductosDetectados([]);
    setOcrPreview('');
    setShowNewModal(true);
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setFormData({
      nombre_producto: product.nombre_producto,
      codigo_original: product.codigo_original,
      id_proveedor: product.id_proveedor,
      precio: product.precio,
      stock: product.stock || ''
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ========== FUNCIÓN PARA GUARDAR PRODUCTO ==========
  const saveProduct = async () => {
    if (!formData.nombre_producto || !formData.codigo_original || !formData.id_proveedor) {
      alert('⚠️ Faltan datos obligatorios: nombre, código o proveedor.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (currentProduct) {
        // Modo edición
        await axios.put(`${API_BASE_URL}/api/productos/${currentProduct.id_producto}`, formData);
        alert('✅ Producto actualizado exitosamente');
        setShowEditModal(false);
      } else {
        // Modo creación
        await axios.post(`${API_BASE_URL}/api/productos`, formData);
        alert('✅ Producto creado exitosamente');
        setShowNewModal(false);
      }

      fetchData(searchTerm, currentPage);
    } catch (error) {
      console.error('❌ Error al guardar producto:', error);
      alert(`Error al guardar producto: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== FUNCIÓN PARA ELIMINAR PRODUCTO ==========
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/productos/${productId}`);
      alert('✅ Producto eliminado exitosamente');
      fetchData(searchTerm, currentPage);
    } catch (error) {
      alert(`❌ Error al eliminar producto: ${error.response?.data?.message || error.message}`);
    }
  };

  // ========== FUNCIONES PARA CERRAR MODALES ==========
  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentProduct(null);
  };

  const closeNewModal = () => {
    setShowNewModal(false);
    setOcrPreview('');
    setProductosDetectados([]);
    setFormData({
      nombre_producto: '',
      codigo_original: '',
      id_proveedor: providers.length > 0 ? providers[0].id_proveedor : '',
      precio: '',
      stock: ''
    });
  };

  // ========== RENDERIZADO CONDICIONAL ==========
  if (loading && products.length === 0) return <div className="loading">Cargando productos...</div>;
  if (error) return <div className="error-message">{error}</div>;

  // ========== RENDERIZADO PRINCIPAL ==========
  return (
    <div className="order-list">
      <div className='container-t1'>
        <h2>Lista de Productos</h2>

        {/* BARRA DE BÚSQUEDA Y CONTROLES */}
        <div className="search-container">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por nombre, código o proveedor..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <span className="total-products">
            {totalProducts} productos encontrados
          </span>
          <button className="btn-add" onClick={handleNewProduct}>
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
              Generar Pedidos
            </button>
          </div>
        )}
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="table-responsive">
        <table className="product-table">
          <thead>
            <tr>
              <th width="50px">✔</th>
              <th width="50px">#</th>
              <th width="100px">Código</th>
              <th>Nombre</th>
              <th>Proveedor</th>
              <th width="100px">Precio</th>
              <th width="120px">Cantidad</th>
              <th width="180px">Acciones</th>
              <th>Fecha de creacion</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-results">
                  {searchTerm
                    ? "No se encontraron productos con esos criterios."
                    : "No hay productos disponibles."}
                </td>
              </tr>
            ) : (
              products.map((product, index) => {
                const absIndex = (currentPage - 1) * itemsPerPage + index + 1;
                const isSelected = !!selectedItems[product.id_producto];
                const quantity = isSelected ? selectedItems[product.id_producto].quantity : 0;

                return (
                  <tr key={product.id_producto} className={isSelected ? "selected-row" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleQuantityChange(
                          product.id_producto,
                          e.target.checked ? 1 : 0
                        )}
                        className="select-checkbox"
                      />
                    </td>
                    <td>{absIndex}</td>
                    <td>
                      <a
                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(product.codigo_original)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'blue', textDecoration: 'underline' }}
                      >
                        {product.codigo_original}
                      </a>
                    </td>
                    <td>{product.nombre_producto}</td>
                    <td>{getProviderName(product.id_proveedor)}</td>
                    <td>C${product.precio != null ? product.precio.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(
                          product.id_producto,
                          e.target.value
                        )}
                        className="quantity-input"
                        disabled={!isSelected}
                      />
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEditProduct(product)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteProduct(product.id_producto)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>

                    <td>{new Date(product.fecha_creacion).toLocaleDateString('es-NI')}</td>
                  </tr>
                );
              })
            )}
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

      {/* MODALES */}
      {showOrderModal && (
        <OrderModal
          groupedOrders={groupedOrders}
          onClose={() => setShowOrderModal(false)}
          onCreateOrders={createOrders}
          isSubmitting={isSubmitting}
        />
      )}

      {showEditModal && (
        <EditProductModal
          product={currentProduct}
          providers={providers}
          onClose={closeEditModal}
          onSave={saveProduct}
          formData={formData}
          onFormChange={handleFormChange}
          isSubmitting={isSubmitting}
        />
      )}

      {showNewModal && (
        <NewProductModal
          providers={providers}
          onClose={closeNewModal}
          onSave={saveProduct}
          formData={formData}
          onFormChange={handleFormChange}
          isSubmitting={isSubmitting}
          onImageUpload={handleImageUpload}
          ocrPreview={ocrPreview}
          loadingImage={loadingImage}
          productosDetectados={productosDetectados}
          onDetectedProductsChange={setProductosDetectados}
          onInsertDetectedProducts={handleInsertDetectedProducts}
        />
      )}
    </div>
  );
};

export default ProductList;