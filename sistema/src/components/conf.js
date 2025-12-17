import React, { useEffect, useState } from 'react';

export default function ConfigView() {
  const [config, setConfig] = useState({});
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch('http://localhost:5001/api/config');
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        if (data.config.logo_path) setPreview('http://localhost:5001' + data.config.logo_path);
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    }
  }

  function handleChange(e) {
    setConfig({ ...config, [e.target.name]: e.target.value });
  }

  function handleFile(e) {
    setLogo(e.target.files[0]);
    setPreview(URL.createObjectURL(e.target.files[0]));
  }

  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(config).forEach(key => fd.append(key, config[key] || ''));
    if (logo) fd.append('logo', logo);

    try {
      const res = await fetch('http://localhost:5001/api/config', {
        method: 'PUT',
        body: fd
      });
      const data = await res.json();
      console.log(data);
      alert(data.message || 'Configuración guardada');
      loadConfig();
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  }

  return (
    <div className="config-container">
      <h2>Configuración del Sistema</h2>
      <form onSubmit={save}>
        <label>Nombre empresa
          <input name="company_name" value={config.company_name || ''} onChange={handleChange} />
        </label>
        <label>RUC
          <input name="ruc" value={config.ruc || ''} onChange={handleChange} />
        </label>
        <label>Dirección
          <input name="address" value={config.address || ''} onChange={handleChange} />
        </label>
        <label>Correo
          <input name="email" value={config.email || ''} onChange={handleChange} />
        </label>
        <label>Teléfono
          <input name="phone" value={config.phone || ''} onChange={handleChange} />
        </label>
        <label>Moneda
          <input name="currency" value={config.currency || ''} onChange={handleChange} />
        </label>
        <label>Logo
          <input type="file" onChange={handleFile} />
        </label>
        {preview && <img src={preview} alt="logo" style={{ maxHeight: '80px' }} />}
        <button>{config.id ? 'Actualizar' : 'Guardar'}</button>
      </form>
    </div>
  );
}
