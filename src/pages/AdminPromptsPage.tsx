import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminNav } from '@/components/AdminNav';
import { apiConfig } from '@/config/api';
import { getAdminToken, setAdminToken, clearAdminToken } from '@/hooks/useAdminAuth';
import { getAdminErrorMessage, isAdminAuthError } from '@/utils/adminErrors';

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminPromptsPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminTokenState] = useState(() => getAdminToken() || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const savedToken = getAdminToken();
    if (savedToken) {
      setAdminTokenState(savedToken);
      fetchTemplates(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = async (token?: string) => {
    const tokenToUse = token || adminToken;
    if (!tokenToUse) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/admin/prompt-templates`, {
        headers: {
          'x-admin-token': tokenToUse,
        },
      });

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        setLoading(false);
        return;
      }

      const data = await res.json();
      setTemplates(data.templates);
      setIsAuthenticated(true);
      setAdminToken(tokenToUse);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching templates:', error);
      alert(getAdminErrorMessage());
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTemplates(adminToken);
  };

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      alert('Preencha nome e conteúdo');
      return;
    }

    try {
      const res = await fetch(`${apiConfig.baseURL}/api/admin/prompt-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(newTemplate),
      });

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        return;
      }

      setNewTemplate({ name: '', content: '' });
      setShowCreateForm(false);
      fetchTemplates();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating template:', error);
      alert(getAdminErrorMessage());
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    try {
      const res = await fetch(
        `${apiConfig.baseURL}/api/admin/prompt-templates/${editingTemplate.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({
            name: editingTemplate.name,
            content: editingTemplate.content,
          }),
        }
      );

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        return;
      }

      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating template:', error);
      alert(getAdminErrorMessage());
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(
        `${apiConfig.baseURL}/api/admin/prompt-templates/${id}/activate`,
        {
          method: 'POST',
          headers: {
            'x-admin-token': adminToken,
          },
        }
      );

      if (!res.ok) {
        if (isAdminAuthError(res.status)) clearAdminToken();
        alert(getAdminErrorMessage(res.status));
        return;
      }

      fetchTemplates();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error activating template:', error);
      alert(getAdminErrorMessage());
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6">🔐 Admin - Prompts</h1>
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium mb-2">Admin Token</label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminTokenState(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              placeholder="Digite o token de admin"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Entrar
            </button>
          </form>
          <p className="mt-4 text-center">
            <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700">
              ← Voltar ao painel admin
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">📝 Gerenciar Prompts</h1>
            <div className="flex gap-4 items-center flex-wrap">
              <AdminNav />
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {showCreateForm ? 'Cancelar' : '+ Novo Template'}
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
              <h2 className="text-xl font-bold mb-4">Criar Novo Template</h2>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="Nome do template"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              />
              <textarea
                value={newTemplate.content}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, content: e.target.value })
                }
                placeholder="Conteúdo do prompt (use {{UPLOADED_IMAGE}}, {{USER_PROMPT}}, {{HAS_TEXT}})"
                rows={15}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 font-mono text-sm"
              />
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Criar Template
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-white rounded-lg shadow-lg p-6 ${
                  template.isActive ? 'border-4 border-green-500' : ''
                }`}
              >
                {editingTemplate?.id === template.id ? (
                  <div>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          name: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-xl font-bold"
                    />
                    <textarea
                      value={editingTemplate.content}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          content: e.target.value,
                        })
                      }
                      rows={15}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 font-mono text-sm"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={handleUpdate}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingTemplate(null)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {template.name}
                          {template.isActive && (
                            <span className="ml-3 text-green-600 text-sm">
                              ✅ ATIVO
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Criado em:{' '}
                          {new Date(template.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!template.isActive && (
                          <button
                            onClick={() => handleActivate(template.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            Ativar
                          </button>
                        )}
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs whitespace-pre-wrap max-h-96">
                      {template.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
