import { useRef, useState } from 'react';
import { parseRawFile } from '../utils/rawParser';
import { formatDateID } from '../utils/format';
import { generateDemoData } from '../utils/generateDemoData';

export default function UploadManager({ dataByDate, setDataByDate }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState([]);

  const dates = Object.keys(dataByDate).sort();

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setLoading(true);
    const newMessages = [];

    for (const file of files) {
      try {
        const { dayGroups, totalRows, skippedRows } = await parseRawFile(file);
        setDataByDate((prev) => {
          const next = { ...prev };
          for (const g of dayGroups) {
            next[g.tanggal] = g;
          }
          return next;
        });
        for (const g of dayGroups) {
          newMessages.push({
            type: 'ok',
            text: `${file.name}: tanggal ${formatDateID(g.tanggal)} — ${g.rows.length.toLocaleString('id-ID')} baris valid` +
              (skippedRows > 0 ? `, ${skippedRows} baris dilewati (tidak lengkap)` : ''),
          });
        }
      } catch (e) {
        newMessages.push({ type: 'err', text: `${file.name}: ${e.message}` });
      }
    }
    setMessages(newMessages);
    setLoading(false);
  }

  function removeDate(dateIso) {
    setDataByDate((prev) => {
      const next = { ...prev };
      delete next[dateIso];
      return next;
    });
  }

  return (
    <div className="panel-box">
      <h2>Upload Data Harian</h2>
      <p className="hint">
        Upload file CSV/XLSX data nominal BJDPL (1 file = 1 tanggal). Tanggal diambil otomatis dari
        <b> nama file</b>, dengan format <code>dd-mm-yyyy.xlsx</code> atau <code>dd-mm-yyyy.csv</code>
        (contoh: <code>29-07-2026.xlsx</code>). Bisa upload beberapa file sekaligus atau satu-satu.
        Perkiraan minimal 7 hari data, boleh lebih atau kurang.
      </p>

      <div
        className={`dropzone${isDragging ? ' is-drag' : ''}${dates.length > 0 ? ' has-file' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="icon">&#128193;</div>
        <div><b>Klik untuk pilih file</b> atau drag &amp; drop di sini (bisa lebih dari satu)</div>
        <div className="hint" style={{ marginTop: 6 }}>Format: .csv, .xlsx</div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <span className="hint" style={{ marginRight: 8 }}>atau</span>
        <button
          className="btn btn-primary"
          onClick={() => setDataByDate(generateDemoData())}
        >
          &#10024; Muat Data Demo
        </button>
      </div>

      {loading && <div className="hint" style={{ marginTop: 10 }}>Memproses file&hellip;</div>}

      {messages.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`validation-banner ${m.type === 'ok' ? 'validation-ok' : 'validation-warn'}`}
              style={{ marginBottom: 6 }}
            >
              {m.text}
            </div>
          ))}
        </div>
      )}

      {dates.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="hint" style={{ marginBottom: 8 }}>
            <b>{dates.length}</b> tanggal sudah masuk:
          </div>
          <div className="date-chip-row">
            {dates.map((d) => (
              <div className="date-chip" key={d}>
                {formatDateID(d)}
                <button className="date-chip-remove" onClick={() => removeDate(d)} title="Hapus tanggal ini">
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
