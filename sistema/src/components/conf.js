import React, { useEffect, useState } from 'react';

export default function ConfigView() {
  const [config, setConfig] = useState({
    company_name: '',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    currency: ''
  });

  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  // Cargar configuración desde backend
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
          currency: cfg.currency || ''
        });

        // Mostrar logo si existe
        if (cfg.logo_path) {
          setPreview('http://localhost:5001' + cfg.logo_path);
        } else {
          setPreview('');
        }
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
      showMessage('Error al cargar la configuración', 'error');
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
      setPreview(URL.createObjectURL(file)); // vista previa inmediata
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  }

  // Guardar cambios en backend
  async function save(e) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    Object.keys(config).forEach(key => {
      fd.append(key, config[key]);
    });

    if (logo) fd.append('logo', logo);

    try {
      const res = await fetch('http://localhost:5001/api/config', {
        method: 'PUT',
        body: fd
      });

      const data = await res.json();

      if (data.ok) {
        showMessage(data.message || '✅ Configuración guardada', 'success');
        setLogo(null);        // limpiar archivo seleccionado
        setFileName('');      // limpiar nombre de archivo
        loadConfig();         // recargar configuración y logo
      } else {
        showMessage(data.error || '❌ Error al guardar', 'error');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      showMessage('❌ Error al guardar la configuración', 'error');
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
          {/** Campos de texto */}
          {['company_name', 'ruc', 'address', 'phone', 'email', 'currency'].map((field) => (
            <div className="input-group" key={field}>
              <label className="input-label">{field.replace('_', ' ').toUpperCase()}</label>
              <input
                name={field}
                value={config[field]}
                onChange={handleChange}
                placeholder={`Ingrese ${field.replace('_', ' ')}`}
                className="input-field"
                disabled={loading}
                type={field === 'email' ? 'email' : 'text'}
              />
            </div>
          ))}

          {/** Logo */}
          <div className="input-group">
            <label className="input-label">Logo de la empresa</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                onChange={handleFile}
                accept="image/*"
                className="file-input"
                disabled={loading}
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
            {loading ? '⏳ Guardando...' : '💾 Guardar Configuración'}
          </button>
        </div>

        {/** Vista previa del logo */}
        <div className="preview-section">
          <h3>Vista Previa del Logo</h3>
          <div className="preview-container">
            {preview ? (
              <img src={preview} alt="Vista previa del logo" className="logo-preview" />
            ) : (
              <div className="empty-preview">
                <p>📁 No se ha seleccionado ningún logo</p>
                <p>Selecciona un archivo de imagen para previsualizarlo aquí</p>
                <p style={{ fontSize: '14px', marginTop: '10px', color: '#718096' }}>
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
