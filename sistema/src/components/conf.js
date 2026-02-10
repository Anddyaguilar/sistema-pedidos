import React, { useEffect, useState } from 'react';

export default function ConfigView() {
  const [config, setConfig] = useState({
    company_name: '',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    currency: '',
    exchange_rate: ''
  });

  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  // Cargar configuración
  async function loadConfig() {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/api/config');
      const data = await res.json();

      if (data.ok && data.config) {
        const cfg = data.config;
        setConfig({
          company_name: cfg.company_name || '',
          ruc: cfg.ruc || '',
          address: cfg.address || '',
          phone: cfg.phone || '',
          email: cfg.email || '',
          currency: cfg.currency || '',
          exchange_rate: cfg.exchange_rate || ''
        });

        setPreview(cfg.logo_path ? 'http://localhost:5001' + cfg.logo_path : '');
      }
    } catch (error) {
      console.error(error);
      showMessage('❌ Error al cargar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setConfig({ ...config, [e.target.name]: e.target.value });
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setFileName(file.name);
      setPreview(URL.createObjectURL(file));
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(config).forEach(([key, value]) => {
      formData.append(key, value?.toString() || '');
    });

    if (logo) formData.append('logo', logo);

    try {
      const res = await fetch('http://localhost:5001/api/config', {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();

      if (data.ok) {
        showMessage('✅ Configuración guardada correctamente', 'success');
        setLogo(null);
        setFileName('');
        loadConfig();
      } else {
        showMessage(data.error || '❌ Error al guardar', 'error');
      }
    } catch (error) {
      console.error(error);
      showMessage('❌ Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="config-container">
      <h2>Configuración del Sistema</h2>

      {message.text && (
        <div className={`status-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="config-wrapper">
        <div className="form-section">

          {[
            { name: 'company_name', label: 'Nombre de la empresa' },
            { name: 'ruc', label: 'RUC' },
            { name: 'address', label: 'Dirección' },
            { name: 'phone', label: 'Teléfono' },
            { name: 'email', label: 'Correo electrónico' },
            { name: 'currency', label: 'Moneda' },
            { name: 'exchange_rate', label: 'Tasa de cambio (USD → C$)' }
          ].map((field) => (
            <div className="input-group" key={field.name}>
              <label className="input-label">{field.label}</label>

              <input
                type={
                  field.name === 'email'
                    ? 'email'
                    : field.name === 'exchange_rate'
                    ? 'number'
                    : 'text'
                }
                step={field.name === 'exchange_rate' ? '0.01' : undefined}
                name={field.name}
                value={config[field.name]}
                onChange={handleChange}
                placeholder={`Ingrese ${field.label.toLowerCase()}`}
                className="input-field"
                disabled={loading}
              />
            </div>
          ))}

          {/* LOGO */}
          <div className="input-group">
            <label className="input-label">Logo de la empresa</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                disabled={loading}
                className="file-input"
              />
              {fileName && <span className="file-name">{fileName}</span>}
            </div>
          </div>

          <button
            type="submit"
            className="save-button"
            onClick={save}
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar configuración'}
          </button>
        </div>

        {/* PREVIEW LOGO */}
        <div className="preview-section">
          <h3>Vista previa del logo</h3>
          <div className="preview-container">
            {preview ? (
              <img
                src={preview}
                alt="Vista previa del logo"
                className="logo-preview"
              />
            ) : (
              <div className="empty-preview">
                <p>📁 No se ha seleccionado ningún logo</p>
                <p>Selecciona una imagen para visualizarla aquí</p>
                <p style={{ fontSize: '14px', color: '#718096' }}>
                  Formatos recomendados: PNG, JPG, SVG
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
