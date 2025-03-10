import { useState, useEffect, useRef } from 'react';
import './App.css';
import TreeView from 'react-treeview';
import 'react-treeview/react-treeview.css';

function App() {
  const [input, setInput] = useState('');
  const [treeData, setTreeData] = useState(null);
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [generatedSentence, setGeneratedSentence] = useState(''); // Main generated sentence
  const [endingSentence, setEndingSentence] = useState(''); // Add state for ending sentence
  const [copiedGenerated, setCopiedGenerated] = useState(false); // Copy state for generated sentence
  const [isEditingVocabulary, setIsEditingVocabulary] = useState(false); // State for editing mode
  const [editedSentence, setEditedSentence] = useState(''); // Temporary storage for edited sentence
  const [selectedWords, setSelectedWords] = useState(new Set()); // Track selected words to prevent duplicates
  const [notification, setNotification] = useState(''); // Notification message for user feedback
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false); // State for language menu
  const [recentlyAddedWord, setRecentlyAddedWord] = useState(null); // Track the recently added word for UI feedback
  
  // Reference for the language dropdown
  const languageMenuRef = useRef(null);
  // Reference for the generated sentence section to scroll to
  const generatedSectionRef = useRef(null);
  
  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    }
    
    // Add event listener if menu is open
    if (isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  // Auto-scroll to generated sentence section when it appears
  useEffect(() => {
    if (generatedSentence && generatedSectionRef.current) {
      // Scroll to the generated sentence section with smooth behavior
      generatedSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [generatedSentence]);
  
  // 添加语言检测功能
  const detectUILanguage = (text) => {
    if (!text || typeof text !== 'string') return 'english'; // 默认英文
    const englishPattern = /^[a-zA-Z0-9\s.,!?;:'"-]+$/;
    return englishPattern.test(text.trim()) ? 'english' : 'chinese';
  };
  
  // 当前界面语言 - 默认使用英文
  const [uiLanguage, setUiLanguage] = useState('english');
  
  // 用户选择的语言
  const [userSelectedLanguage, setUserSelectedLanguage] = useState(null);
  
  // 切换语言
  const toggleLanguage = (lang) => {
    setUserSelectedLanguage(lang);
    setUiLanguage(lang);
  };
  
  // 根据输入更新UI语言，但仅当未手动选择语言时
  useEffect(() => {
    if (input.trim() && !userSelectedLanguage) {
      setUiLanguage(detectUILanguage(input));
    }
  }, [input, userSelectedLanguage]);
  
  // 多语言UI文本
  const uiText = {
    chinese: {
      title: '提示词生成器',
      inputPlaceholder: '输入您的想法 (例如: 我想开发一个网站)',
      generateButton: '生成提示词',
      generateButtonLoading: '正在生成...',
      usageRemaining: '剩余使用次数',
      clearButton: '清除',
      copyButton: '复制到剪贴板',
      copiedText: '已复制！',
      emptyInput: '请输入您的想法！',
      vocabularyTree: '词汇层次结构',
      selectedVocabulary: '已选择的词汇',
      generateSentence: '生成句子',
      enterIdea: '输入您的想法:',
      browseVocabulary: '浏览词汇树:',
      clickToAdd: '点击添加词汇',
      errorGeneratingPrompt: '生成句子时出错，请稍后再试',
      incorrectDataFormat: 'API返回的数据格式不正确',
      errorGeneratingTree: '生成树结构时出错',
      languageSwitcher: '语言',
      generatedSentence: '生成的句子',
      generatedSentenceDescription: '这是根据您的想法和选定词汇生成的句子。',
      editButton: '编辑',
      saveButton: '保存',
      cancelButton: '取消',
      endingRequest: '结尾请求',
      copyAll: '复制全部',
      wordAlreadyAdded: '"{word}" 已经添加过了',
      wordAdded: '已添加'
    },
    english: {
      title: 'Prompt Generator',
      inputPlaceholder: 'Enter your idea (e.g., I want to develop a website)',
      generateButton: 'Generate Prompt',
      generateButtonLoading: 'Generating...',
      usageRemaining: 'Remaining usage',
      clearButton: 'Clear',
      copyButton: 'Copy to Clipboard',
      copiedText: 'Copied!',
      emptyInput: 'Please enter your idea!',
      vocabularyTree: 'Vocabulary Hierarchy',
      selectedVocabulary: 'Selected Vocabulary',
      generateSentence: 'Generate Sentence',
      enterIdea: 'Enter your idea:',
      browseVocabulary: 'Browse vocabulary tree:',
      clickToAdd: 'Click to add vocabulary',
      errorGeneratingPrompt: 'Error generating sentence, please try again later',
      incorrectDataFormat: 'Incorrect data format returned by API',
      errorGeneratingTree: 'Error generating tree structure',
      languageSwitcher: 'Language',
      generatedSentence: 'Generated Sentence',
      generatedSentenceDescription: 'This is the sentence generated based on your idea and selected vocabulary.',
      editButton: 'Edit',
      saveButton: 'Save',
      cancelButton: 'Cancel',
      endingRequest: 'Ending Request',
      copyAll: 'Copy All',
      wordAlreadyAdded: '"{word}" has already been added',
      wordAdded: 'Added'
    }
  };
  
  const handleSubmit = async () => {
    if (!input.trim()) {
      // 使用适当的语言显示错误
      setError(uiText[uiLanguage].emptyInput);
      return;
    }

    // Clear existing sentence when regenerating
    setSentence('');
    setGeneratedSentence('');
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3002/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      const data = await response.json();
      console.log('API响应:', data);
      
      if (!response.ok) {
        setError(data.message || uiText[uiLanguage].errorGeneratingTree);
        setTreeData(null);
      } else {
        if (data.tree) {
          setTreeData(data.tree);
          if (data.usage) {
            setUsageInfo(data.usage);
          }
        } else {
          setError(uiText[uiLanguage].incorrectDataFormat);
          setTreeData(null);
        }
      }
    } catch (error) {
      console.error('Error generating tree:', error);
      setError(uiText[uiLanguage].errorGeneratingTree);
      setTreeData(null);
    } finally {
      setLoading(false);
    }
  };

  const addToSentence = (word) => {
    // Check if the word is already in the selected words set
    if (selectedWords.has(word)) {
      // Word already selected - show notification
      setNotification(uiText[uiLanguage].wordAlreadyAdded.replace('{word}', word));
      return;
    }
    
    // Add to sentence and update selected words
    setSentence(sentence + ' ' + word);
    setSelectedWords(prev => {
      const newSet = new Set(prev);
      newSet.add(word);
      return newSet;
    });
    
    // Set the recently added word to show UI feedback
    setRecentlyAddedWord(word);
  };

  const handleClearSentence = () => {
    setSentence('');
    setSelectedWords(new Set()); // Clear selected words when clearing sentence
  };

  const startEditingSentence = () => {
    setEditedSentence(sentence);
    setIsEditingVocabulary(true);
  };

  const saveEditedSentence = () => {
    setSentence(editedSentence);
    setIsEditingVocabulary(false);
    
    // Rebuild the selected words set based on the edited sentence
    const wordsArray = editedSentence.trim().split(/\s+/).filter(word => word);
    setSelectedWords(new Set(wordsArray));
  };

  const cancelEditingSentence = () => {
    setIsEditingVocabulary(false);
    setEditedSentence('');
  };

  const handleEditInputChange = (e) => {
    setEditedSentence(e.target.value);
  };

  const handleKeyDown = (e) => {
    // If user presses Enter and Shift, allow multiline
    // If user presses Enter without Shift, save changes
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEditedSentence();
    }
    // If user presses Escape, cancel editing
    if (e.key === 'Escape') {
      cancelEditingSentence();
    }
  };

  const generateSentence = async () => {
    if (!input.trim() || !sentence.trim().length) {
      setError(uiText[uiLanguage].emptyInput);
      return;
    }
    
    // Clear existing sentences when regenerating
    setGeneratedSentence('');
    setEndingSentence('');
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3002/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalInput: input,
          selectedWords: sentence.trim().split(' '),
          includeEndingSentence: true  // We need both main sentence and ending sentence
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || uiText[uiLanguage].errorGeneratingPrompt);
      } else {
        console.log('Received data from API:', data); // Add logging to check the response
        if (data.mainSentence) {
          // Store both the main sentence and ending sentence
          setGeneratedSentence(data.mainSentence);
          setEndingSentence(data.endingSentence || '');
        } else if (data.optimizedPrompt) {
          // The API returns optimizedPrompt and endingSentence
          setGeneratedSentence(data.optimizedPrompt);
          setEndingSentence(data.endingSentence || '');
        } else {
          setError(uiText[uiLanguage].incorrectDataFormat);
        }
      }
    } catch (error) {
      console.error('Error generating sentence:', error);
      setError(uiLanguage === 'english' ? 'Error generating sentence, please try again later' : '生成句子时出错，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedGenerated(true);
        setTimeout(() => setCopiedGenerated(false), 2000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert(uiLanguage === 'english' ? 'Copy failed, please copy manually' : '复制失败，请手动复制');
      });
  };

  const copyBothSentences = () => {
    if (!generatedSentence || !endingSentence) return;
    
    // Simply join sentences with a space, without adding punctuation
    const combinedText = `${generatedSentence} ${endingSentence}`;
      
    copyToClipboard(combinedText);
  };

  const generateSentenceWithAI = async () => {
    if (!treeData) return;
    
    setLoading(true);
    setError(null);
    try {
      // 获取用户选择的词汇
      const selectedWords = sentence.trim();
      if (!selectedWords) {
        setError('请先选择一些词汇');
        setLoading(false);
        return;
      }
      
      // 调用新的API端点来优化提示词句子
      const response = await fetch('http://localhost:3002/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          originalInput: input, 
          selectedWords: selectedWords 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || '生成优化句子时出错');
      } else {
        if (data.optimizedPrompt) {
          setSentence(data.optimizedPrompt);
        } else {
          setError('API返回的数据格式不正确');
        }
      }
    } catch (error) {
      console.error('Error generating optimized sentence:', error);
      setError('优化句子时出错，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // Reset recently added word state after a short delay
  useEffect(() => {
    let timer;
    if (recentlyAddedWord) {
      timer = setTimeout(() => {
        setRecentlyAddedWord(null);
      }, 1500); // Show "Added" indicator for 1.5 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [recentlyAddedWord]);

  // 递归渲染树节点
  const renderTreeNode = (nodeKey, nodeValue) => {
    if (Array.isArray(nodeValue)) {
      // 叶子节点 - 词汇列表
      return (
        <div className="word-category" key={nodeKey}>
          <h4>{nodeKey}</h4>
          <div className="word-buttons">
            {nodeValue.map((word) => (
              <button 
                key={word} 
                onClick={() => addToSentence(word)} 
                className={`word-button ${recentlyAddedWord === word ? 'word-added' : ''}`}
              >
                {recentlyAddedWord === word ? (
                  <span className="word-added-text">
                    {uiText[uiLanguage].wordAdded}
                  </span>
                ) : word}
              </button>
            ))}
          </div>
        </div>
      );
    } else {
      // 中间节点 - 有子节点的对象
      return (
        <TreeView 
          key={nodeKey}
          nodeLabel={<span className="tree-node-label">{nodeKey}</span>}
          defaultCollapsed={false}
          className="tree-view-container"
        >
          {Object.entries(nodeValue).map(([childKey, childValue]) => 
            renderTreeNode(childKey, childValue)
          )}
        </TreeView>
      );
    }
  };

  // Add notification timeout handling
  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => {
        setNotification('');
      }, 3000); // Hide notification after 3 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notification]);
  
  // Initialize selectedWords based on the current sentence when component loads
  useEffect(() => {
    if (sentence.trim()) {
      const wordsArray = sentence.trim().split(/\s+/).filter(word => word);
      setSelectedWords(new Set(wordsArray));
    }
  }, []);

  return (
    <div className="App">
      <header>
        <h1>{uiText[uiLanguage].title}</h1>
        <div className="language-switcher" ref={languageMenuRef}>
          <button 
            className="globe-button"
            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            aria-label={uiText[uiLanguage].languageSwitcher}
          >
            <svg className="globe-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </button>
          
          {isLanguageMenuOpen && (
            <div className="language-dropdown">
              <button 
                className={`language-item ${uiLanguage === 'english' ? 'active' : ''}`} 
                onClick={() => {
                  toggleLanguage('english');
                  setIsLanguageMenuOpen(false);
                }}
              >
                <span className="language-name">English</span>
                {uiLanguage === 'english' && (
                  <svg className="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
              <button 
                className={`language-item ${uiLanguage === 'chinese' ? 'active' : ''}`} 
                onClick={() => {
                  toggleLanguage('chinese');
                  setIsLanguageMenuOpen(false);
                }}
              >
                <span className="language-name">中文</span>
                {uiLanguage === 'chinese' && (
                  <svg className="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
       
        {usageInfo && (
          <div className="usage-info">
            <p>{uiText[uiLanguage].usageRemaining}: {usageInfo.remaining}/{usageInfo.limit}</p>
          </div>
        )}
      </header>
      
      {/* Notification display */}
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
      
      <section className="input-section">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={uiText[uiLanguage].inputPlaceholder}
          disabled={loading}
        />
        <button onClick={handleSubmit} disabled={loading} className="primary-button">
          {loading ? uiText[uiLanguage].generateButtonLoading : uiText[uiLanguage].generateButton}
        </button>
      </section>
      
      {error && <div className="error-message">{error}</div>}

      {treeData && (
        <section className="word-tree">
          <h2>{uiText[uiLanguage].vocabularyTree}</h2>
          <div className="tree-container">
            {Object.entries(treeData).map(([key, value]) => 
              renderTreeNode(key, value)
            )}
          </div>
          
          <div className="sentence-section">
            <h3>{uiText[uiLanguage].selectedVocabulary}</h3>
            <div className={`sentence-display ${isEditingVocabulary ? 'editing' : ''}`}>
              {isEditingVocabulary ? (
                <textarea 
                  value={editedSentence}
                  onChange={handleEditInputChange}
                  onKeyDown={handleKeyDown}
                  className="sentence-edit-input"
                  placeholder={uiText[uiLanguage].clickToAdd}
                  autoFocus
                />
              ) : (
                sentence || <span className="placeholder-text">{uiText[uiLanguage].clickToAdd}</span>
              )}
            </div>
            <div className="prompt-actions">
              {isEditingVocabulary ? (
                <>
                  <button onClick={cancelEditingSentence} className="secondary-button">
                    {uiText[uiLanguage].cancelButton}
                  </button>
                  <button onClick={saveEditedSentence} className="primary-button">
                    {uiText[uiLanguage].saveButton}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={startEditingSentence} disabled={loading} className="secondary-button">
                    {uiText[uiLanguage].editButton}
                  </button>
                  <button onClick={handleClearSentence} disabled={!sentence.trim() || loading} className="secondary-button">
                    {uiText[uiLanguage].clearButton}
                  </button>
                  <button onClick={generateSentence} disabled={!treeData || !sentence.trim() || loading} className="secondary-button">
                    {uiText[uiLanguage].generateSentence}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {loading && !treeData && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>{uiText[uiLanguage].generateButtonLoading}</p>
        </div>
      )}

      {/* Show loading indicator for sentence generation */}
      {loading && treeData && (
        <section className="loading-sentence-section">
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>{uiText[uiLanguage].generateButtonLoading}</p>
          </div>
        </section>
      )}

      {generatedSentence && (
        <section className="generated-sentence-section" ref={generatedSectionRef}>
          <div className="section-header">
            <h2>{uiText[uiLanguage].generatedSentence}</h2>
            <div className="copy-buttons">
              <button 
                onClick={() => endingSentence ? copyBothSentences() : copyToClipboard(generatedSentence)} 
                className="one-click-copy"
              >
                {copiedGenerated ? uiText[uiLanguage].copiedText : uiText[uiLanguage].copyButton}
              </button>
            </div>
          </div>
          <p className="sentence-description">{uiText[uiLanguage].generatedSentenceDescription}</p>
          <div className="sentence-box">
            <p>
              {endingSentence 
                ? `${generatedSentence} ${endingSentence}`  // Always just use a space, no automatic period
                : generatedSentence
              }
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;