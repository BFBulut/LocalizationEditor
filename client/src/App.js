import React, { useState } from 'react';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('tr'); // Default source language
  const [isTranslating, setIsTranslating] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const headers = Object.keys(results.data[0] || {});
          setHeaders(headers);
          setCsvData(results.data);
          if (headers.includes('tr')) {
            setSourceLanguage('tr');
          } else if (headers.length > 1) {
            setSourceLanguage(headers[1]); // Assume second column is a good default
          }
        }
      });
    }
  };

  const handleCellChange = (e, rowIndex, header) => {
    const newData = [...csvData];
    newData[rowIndex][header] = e.target.value;
    setCsvData(newData);
  };

  const addRow = () => {
    const newRow = headers.reduce((acc, header) => {
      acc[header] = '';
      return acc;
    }, { [headers[0] || 'Key']: `New_Key_${csvData.length + 1}`});
    setCsvData([...csvData, newRow]);
  };

  const addColumn = () => {
    if (newLanguage && !headers.includes(newLanguage)) {
      setHeaders([...headers, newLanguage]);
      const newData = csvData.map(row => ({...row, [newLanguage]: ''}));
      setCsvData(newData);
      setNewLanguage('');
    } else {
      alert("Lütfen geçerli ve benzersiz bir dil adı girin.");
    }
  };

  const autoTranslate = async () => {
    setIsTranslating(true);
    const newData = [...csvData];
    const targetLangs = headers.filter(h => h !== headers[0] && h !== sourceLanguage);

    for (let i = 0; i < newData.length; i++) {
      const row = newData[i];
      const sourceText = row[sourceLanguage];

      if (sourceText) {
        const translationsToFetch = {};
        targetLangs.forEach(lang => {
          if (!row[lang]) { // Only translate if target is empty
            translationsToFetch[lang] = lang;
          }
        });

        if (Object.keys(translationsToFetch).length > 0) {
          try {
            const response = await fetch('http://localhost:5000/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: sourceText,
                sourceLang: sourceLanguage,
                targetLangs: Object.values(translationsToFetch)
              })
            });
            const translatedTexts = await response.json();
            if (response.ok) {
              for (const lang in translatedTexts) {
                newData[i][lang] = translatedTexts[lang];
              }
            } else {
              console.error("Translation API error:", translatedTexts.error);
            }
          } catch (error) {
            console.error("Failed to fetch translations:", error);
          }
        }
      }
    }
    setCsvData(newData);
    setIsTranslating(false);
  };

  const downloadCsv = () => {
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "localization.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="main-container">
      <header className="app-header">
        <h1>Unity Localization Editor</h1>
        <p className="subtitle">CSV dosyalarınızı kolayca düzenleyin ve tek tıkla çevirin.</p>
      </header>

      <div className="file-handler-section">
        <h2>Başlayın</h2>
        <p>Düzenlemeye başlamak için mevcut bir <code>.csv</code> dosyasını yükleyin.</p>
        <input type="file" id="csv-upload" className="native-file-input" accept=".csv" onChange={handleFileUpload} />
        <label htmlFor="csv-upload" className="custom-file-upload">
         Dosya Seç
        </label>
      </div>

      <main className="content-main">
        {headers.length > 0 && (
          <div className="controls">
             <button onClick={addRow}>Yeni Anahtar Ekle</button>
            <div>
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Yeni Dil Adı"
              />
              <button onClick={addColumn}>Yeni Dil Ekle</button>
            </div>
            <div className="translation-controls">
              <label htmlFor="source-lang">Kaynak Dil: </label>
              <select id="source-lang" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
                {headers.filter(h => h !== headers[0]).map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
              <button onClick={autoTranslate} disabled={isTranslating}>
                {isTranslating ? 'Çevriliyor...' : 'Otomatik Doldur'}
              </button>
            </div>
          </div>
        )}
        {csvData.length > 0 && (
          <>
            <div className="table-container">
              <table>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header) => (
                      <td key={header}>
                        <input
                          type="text"
                          value={row[header] || ''}
                          onChange={(e) => handleCellChange(e, rowIndex, header)}
                          className="cell-input"
                          readOnly={header === headers[0]}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            <div className="download-container">
              <button onClick={downloadCsv} className="download-btn">CSV Olarak İndir</button>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Unity Localization Editor | 2024</p>
      </footer>
    </div>
  );
}

export default App;
