import React, { useState, useEffect, useCallback } from 'react';

// Проверка валидности JSON
function isJSONValid(str) {
  if (typeof str !== 'string') return false;
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
}

const App = () => {
  const [formData, setFormData] = useState({
    subject: '',
    requesterName: '',
    email: '',
    team: '',
    agent: '',
    priority: 'Medium',
    status: 'open',
    privateNote: '',
    sendNotification: false,
    tags: []
  });

  const [newTag, setNewTag] = useState('');
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [teamSuggestions, setTeamSuggestions] = useState([]);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  const [agentSuggestions, setAgentSuggestions] = useState([]);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const [teamInputValue, setTeamInputValue] = useState('');
  const [agentInputValue, setAgentInputValue] = useState('');
  const [pageData, setPageData] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastCreatedTicket, setLastCreatedTicket] = useState(null);

  // Функции для сохранения и загрузки данных формы
  const saveFormData = useCallback((data) => {
    try {
      localStorage.setItem('ticket_form_data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, []);

  const loadFormData = useCallback(() => {
    try {
      const savedData = localStorage.getItem('ticket_form_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        console.log('Loaded saved form data:', parsedData);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }, []);

  const saveLastCreatedTicket = useCallback((ticketData) => {
    try {
      localStorage.setItem('last_created_ticket', JSON.stringify(ticketData));
    } catch (error) {
      console.error('Error saving last created ticket:', error);
    }
  }, []);

  const loadLastCreatedTicket = useCallback(() => {
    try {
      const savedTicket = localStorage.getItem('last_created_ticket');
      if (savedTicket) {
        const parsedTicket = JSON.parse(savedTicket);
        setLastCreatedTicket(parsedTicket);
        console.log('Loaded last created ticket:', parsedTicket);
      }
    } catch (error) {
      console.error('Error loading last created ticket:', error);
    }
  }, []);

  const initializeInputValues = useCallback(() => {
    if (formData.team && teamInputValue === '') {
      setTeamInputValue(getTeamName(formData.team));
    }
    if (formData.agent && agentInputValue === '') {
      setAgentInputValue(getAgentName(formData.agent));
    }
  }, 
  //[formData.team, formData.agent, teamInputValue, agentInputValue]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [formData.team, formData.agent, teamInputValue, agentInputValue]);

  // Упрощённая функция получения pageData только из URL параметров
  const getPageData = useCallback(() => {
    try {
      // Получаем данные из URL параметров
      const urlParams = new URLSearchParams(window.location.search);
      const conversationIdFromParams = urlParams.get('conversation_id');
      const allData = {
        conversationId: conversationIdFromParams || '',
        currentUrl: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      };
      setPageData(allData);
      return allData;
    } catch (error) {
      console.error('Error getting page data:', error);
      return {};
    }
  }, []);

  // Удаляем все useEffect и функции, связанные с Chrome API, postMessage, window.parent, window.chatwootData и т.д.

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://chatwoot.qodeq.net/service/api/v1/helpdesk/agents_list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const agentsData = await response.json();
        setAgents(agentsData);
      } else {
        console.error('Failed to fetch agents:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('https://chatwoot.qodeq.net/service/api/v1/helpdesk/teams_list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const teamsData = await response.json();
        setTeams(teamsData);
      } else {
        console.error('Failed to fetch teams:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('https://chatwoot.qodeq.net/service/api/v1/helpdesk/tags_list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const tagsData = await response.json();
        setAvailableTags(tagsData);
      } else {
        console.error('Failed to fetch tags:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  useEffect(() => {
    if (!dataLoaded) {
      loadFormData();
      loadLastCreatedTicket();
      getPageData();
      fetchAgents();
      fetchTeams();
      fetchTags();
      setDataLoaded(true);
    }
  }, [dataLoaded, getPageData, loadFormData, loadLastCreatedTicket, fetchAgents, fetchTeams, fetchTags]);

  useEffect(() => {
    initializeInputValues();
  }, [initializeInputValues]);

  // Интеграция с Chatwoot Dashboard Apps
  useEffect(() => {
    // Запрашиваем данные у Chatwoot Dashboard
    if (window.parent && window.parent !== window) {
      window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');
    }

    // Слушаем ответы
    function handleDashboardMessage(event) {
      if (!isJSONValid(event.data)) return;
      const eventData = JSON.parse(event.data);
      // Выводим в консоль полученные данные
      console.log('[Chatwoot Dashboard App] Получен eventData:', eventData);
    }
    window.addEventListener('message', handleDashboardMessage);
    return () => window.removeEventListener('message', handleDashboardMessage);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      // Автоматически сохраняем данные при каждом изменении
      saveFormData(newData);
      return newData;
    });
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setNewTag(value);
    
    if (value.trim()) {
      // Фильтруем доступные теги по введенному тексту
      const filtered = availableTags.filter(tag => {
        const tagText = tag.name || tag.id || tag;
        return tagText.toLowerCase().includes(value.toLowerCase());
      });
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  

  const handleTeamInputChange = (e) => {
    const value = e.target.value;
    setTeamInputValue(value);
    
    // Если поле пустое, очищаем выбранную команду
    if (!value.trim()) {
      setFormData(prev => {
        const newData = {
          ...prev,
          team: ''
        };
        saveFormData(newData);
        return newData;
      });
    }
    
    if (value.trim()) {
      // Фильтруем доступные команды по введенному тексту
      const filtered = teams.filter(team => {
        const teamText = team.name || team.ID || team.id || team;
        return teamText.toLowerCase().includes(value.toLowerCase());
      });
      setTeamSuggestions(filtered);
      setShowTeamSuggestions(true);
    } else {
      setTeamSuggestions([]);
      setShowTeamSuggestions(false);
    }
  };

  const handleAgentInputChange = (e) => {
    const value = e.target.value;
    setAgentInputValue(value);
    
    // Если поле пустое, очищаем выбранного агента
    if (!value.trim()) {
      setFormData(prev => {
        const newData = {
          ...prev,
          agent: ''
        };
        saveFormData(newData);
        return newData;
      });
    }
    
    if (value.trim()) {
      // Фильтруем доступных агентов по введенному тексту
      const filtered = agents.filter(agent => {
        const agentText = agent.name || agent.ID || agent.id || agent;
        return agentText.toLowerCase().includes(value.toLowerCase());
      });
      setAgentSuggestions(filtered);
      setShowAgentSuggestions(true);
    } else {
      setAgentSuggestions([]);
      setShowAgentSuggestions(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      // Ищем тег в доступных тегах по имени
      const foundTag = availableTags.find(tag => {
        const tagName = tag.name || tag.id || tag;
        return tagName.toLowerCase() === newTag.trim().toLowerCase();
      });
      
      // Добавляем только если тег найден
      if (foundTag) {
        const tagToAdd = foundTag.ID || foundTag.id || foundTag;
        if (!formData.tags.includes(tagToAdd)) {
          setFormData(prev => {
            const newData = {
              ...prev,
              tags: [...prev.tags, tagToAdd]
            };
            saveFormData(newData);
            return newData;
          });
        }
      } else {
        // Если тег не найден, показываем уведомление
        alert('Tag not found. Please select from the available tags.');
      }
      setNewTag('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const tagId = suggestion.ID || suggestion.id || suggestion;
    if (!formData.tags.includes(tagId)) {
      setFormData(prev => {
        const newData = {
          ...prev,
          tags: [...prev.tags, tagId]
        };
        saveFormData(newData);
        return newData;
      });
    }
    setNewTag('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleTeamSuggestionClick = (suggestion) => {
    const teamId = suggestion.ID || suggestion.id || suggestion;
    const teamName = suggestion.name || suggestion.ID || suggestion.id || suggestion;
    setFormData(prev => {
      const newData = {
        ...prev,
        team: teamId
      };
      saveFormData(newData);
      return newData;
    });
    setTeamInputValue(teamName);
    setTeamSuggestions([]);
    setShowTeamSuggestions(false);
  };

  const handleAgentSuggestionClick = (suggestion) => {
    const agentId = suggestion.ID || suggestion.id || suggestion;
    const agentName = suggestion.name || suggestion.ID || suggestion.id || suggestion;
    setFormData(prev => {
      const newData = {
        ...prev,
        agent: agentId
      };
      saveFormData(newData);
      return newData;
    });
    setAgentInputValue(agentName);
    setAgentSuggestions([]);
    setShowAgentSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      };
      saveFormData(newData);
      return newData;
    });
  };

  const handleSelectTag = (selectedTag) => {
    if (selectedTag && !formData.tags.includes(selectedTag)) {
      // Убеждаемся, что передается ID, а не имя
      const tagId = selectedTag;
      setFormData(prev => {
        const newData = {
          ...prev,
          tags: [...prev.tags, tagId]
        };
        saveFormData(newData);
        return newData;
      });
    }
  };

  // Функция для получения имени тега по ID
  const getTagName = (tagId) => {
    const foundTag = availableTags.find(tag => {
      const tagIdToCompare = tag.ID || tag.id || tag;
      return String(tagIdToCompare) === String(tagId);
    });
    return foundTag ? (foundTag.name || foundTag.id || foundTag) : tagId;
  };

  // Функция для получения имени команды по ID
  const getTeamName = (teamId) => {
    const foundTeam = teams.find(team => {
      const teamIdToCompare = team.ID || team.id || team;
      return String(teamIdToCompare) === String(teamId);
    });
    return foundTeam ? (foundTeam.name || foundTeam.ID || foundTeam.id || foundTeam) : teamId;
  };

  // Функция для получения имени агента по ID
  const getAgentName = (agentId) => {
    const foundAgent = agents.find(agent => {
      const agentIdToCompare = agent.ID || agent.id || agent;
      return String(agentIdToCompare) === String(agentId);
    });
    return foundAgent ? (foundAgent.name || foundAgent.ID || foundAgent.id || foundAgent) : agentId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    console.log('Page data available:', pageData);
    
    // Получаем актуальный Conversation ID перед отправкой
    // getCurrentConversationId(); // Удалено
    
    // Небольшая задержка для обновления состояния
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Проверяем наличие Conversation ID
    const conversationId = pageData.conversationId;
    if (!conversationId) {
      alert('Conversation ID not found. Please make sure you are on a conversation page.');
      return;
    }
    
    // Подготавливаем данные для отправки
    const requestData = {
      subject: formData.subject || "Ticket from chat",
      requester: {
        email: formData.email || "",
        name: formData.requesterName || "Client"
      },
      assignment: {
        team: {
          ID: (() => {
            if (typeof formData.team === 'object' && formData.team !== null) {
              return formData.team.id || formData.team.ID || "";
            }
            return formData.team || "";
          })()
        }
      },
      priority: getPriorityNumber(formData.priority),
      status: formData.status.toLowerCase() || "open",
      tagIDs: [], // Будет заполнено позже
      notes: formData.privateNote || ""
    };

    // Добавляем агента только если он выбран
    if (formData.agent && formData.agent.trim() !== '') {
      requestData.assignment.agent = {
        ID: (() => {
          if (typeof formData.agent === 'object' && formData.agent !== null) {
            return formData.agent.id || formData.agent.ID || "";
          }
          return formData.agent || "";
        })()
      };
    }

    // Преобразуем теги в ID (передаем строковые UUID)
    if (formData.tags.length > 0) {
      requestData.tagIDs = formData.tags.map(tag => String(tag));
    }

    console.log('Request data:', requestData);
    console.log('Using conversation ID:', conversationId);
    console.log('Form data team:', formData.team, 'type:', typeof formData.team);
    console.log('Form data agent:', formData.agent, 'type:', typeof formData.agent);
    console.log('Form data tags:', formData.tags);
    console.log('Tag IDs being sent:', requestData.tagIDs);
    console.log('Available tags sample:', availableTags.slice(0, 3));
    
    try {
      const response = await fetch(`https://chatwoot.qodeq.net/service/api/v1/helpdesk/ticket-from-chat/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',

        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        console.log('Ticket created successfully');
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        // Сохраняем данные о созданном тикете
        const ticketInfo = {
          id: responseData.id || responseData.ID || 'Unknown',
          subject: requestData.subject,
          conversationId: conversationId,
          createdAt: new Date().toISOString(),
          url: responseData.url || responseData.link || `https://chatwoot.qodeq.net/helpdesk/tickets/${responseData.id || responseData.ID}`
        };
        saveLastCreatedTicket(ticketInfo);
        setLastCreatedTicket(ticketInfo);
        
        // Очищаем форму после успешного создания
        const clearedFormData = {
          subject: '',
          requesterName: '',
          email: '',
          team: '',
          agent: '',
          priority: 'Medium',
          status: 'open',
          privateNote: '',
          sendNotification: false,
          tags: []
        };
        setFormData(clearedFormData);
        setNewTag('');
        
        // Очищаем поля ввода
        setTeamInputValue('');
        setAgentInputValue('');
        
        // Очищаем сохраненные данные
        saveFormData(clearedFormData);
        
        // Показываем уведомление об успехе
        alert('Ticket created successfully!');
      } else {
        console.error('Failed to create ticket:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert('Failed to create ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket. Please check your connection and try again.');
    }
  };

  // Функция для преобразования приоритета в число
  const getPriorityNumber = (priority) => {
    switch (priority) {
      case 'Low': return -10;
      case 'Medium': return 0;
      case 'High': return 10;
      case 'Urgent': return 20;
      default: return 0;
    }
  };

  return (
    <div className="app-container">
      <h1>📝 Создать тикет</h1>
      <hr />
      
      {/* Отладочная информация */}
      {pageData.conversationId ? (
        <div className="status-message">
          <strong>Conversation ID:</strong> {pageData.conversationId}
        </div>
      ) : (
        <div className="status-message error">
          Conversation ID не найден. Добавьте ?conversation_id=... в URL.
        </div>
      )}
      
      {/* Информация о последнем созданном тикете */}
      {lastCreatedTicket && (
        <div className="status-message">
          <div><strong>Последний тикет:</strong> {lastCreatedTicket.subject}</div>
          <div><a href={lastCreatedTicket.url} target="_blank" rel="noopener noreferrer">Открыть тикет →</a></div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Тема тикета</label>
          <input type="text" name="subject" value={formData.subject} onChange={handleChange} required />
        </div>

        <div>
          <label>Имя клиента</label>
          <input type="text" name="requesterName" value={formData.requesterName} onChange={handleChange} required />
        </div>

        <div>
          <label>Email клиента</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div>
          <label>Команда</label>
          <input type="text" value={teamInputValue !== '' ? teamInputValue : getTeamName(formData.team)} onChange={handleTeamInputChange} placeholder="Введите название команды..." />
          {showTeamSuggestions && teamSuggestions.length > 0 && (
            <div className="suggestion-container">
              {teamSuggestions.map((team, index) => (
                <div key={index} onClick={() => handleTeamSuggestionClick(team)}>{team.name || team.ID || team.id || team}</div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label>Агент</label>
          <input type="text" value={agentInputValue !== '' ? agentInputValue : getAgentName(formData.agent)} onChange={handleAgentInputChange} placeholder="Введите имя агента... (необязательно)" disabled={loading} />
          {showAgentSuggestions && agentSuggestions.length > 0 && (
            <div className="suggestion-container">
              {agentSuggestions.map((agent, index) => (
                <div key={index} onClick={() => handleAgentSuggestionClick(agent)}>{agent.name || agent.ID || agent.id || agent}</div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label>Приоритет</label>
          <select name="priority" value={formData.priority} onChange={handleChange}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label>Статус</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="onhold">On Hold</option>
            <option value="solved">Solved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label>Теги</label>
          <input type="text" value={newTag} onChange={handleTagInputChange} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Введите тег..." />
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestion-container">
              {suggestions.map((suggestion, index) => (
                <div key={index} onClick={() => handleSuggestionClick(suggestion)}>{suggestion.name || suggestion.id || suggestion}</div>
              ))}
            </div>
          )}
          {availableTags.length > 0 && (
            <select onChange={e => handleSelectTag(e.target.value)} value="">
              <option value="">Выберите тег...</option>
              {availableTags.map((tag, index) => (
                <option key={index} value={tag.ID || tag.id || tag}>{tag.name || tag.ID || tag.id || tag}</option>
              ))}
            </select>
          )}
          <div className="tags-list">
            {formData.tags.map(tag => (
              <span className="tag-item" key={tag}>
                {getTagName(tag)}
                <button type="button" onClick={() => handleRemoveTag(tag)} title="Удалить тег">×</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label>Приватная заметка</label>
          <textarea name="privateNote" value={formData.privateNote} onChange={handleChange} rows={3} />
        </div>

        <div style={{display:'flex',gap:'10px'}}>
          <button type="submit" disabled={!pageData.conversationId}>Создать тикет</button>
          <button type="button" className="secondary-btn" onClick={() => {
            const clearedFormData = {
              subject: '', requesterName: '', email: '', team: '', agent: '', priority: 'Medium', status: 'open', privateNote: '', sendNotification: false, tags: []
            };
            setFormData(clearedFormData);
            setNewTag('');
            saveFormData(clearedFormData);
          }}>Очистить</button>
        </div>
      </form>
    </div>
  );
};

export default App;
