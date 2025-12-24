import React, { useState, useEffect } from "react";
import { Practice, PracticeStatus, FilterState } from "../types/index";
import { Icons } from "./icons";

interface AddEditModalProps {
  isOpen: boolean;
  initialData: Practice | null;
  onClose: () => void;
  // onSubmit возвращает Promise, чтобы мы могли ждать завершения и ловить ошибки
  onSubmit: (data: Omit<Practice, "id" | "dateAdded">) => Promise<void>;
  api?: any; 
}

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  api?: any;
}

const emptyForm = {
  studentName: "",
  student_id: 0,
  practiceType: "industrial" as Practice["practiceType"],
  university: "",
  faculty: "",
  year: new Date().getFullYear().toString(),
  status: "pending" as PracticeStatus,
  startDate: "",
  endDate: "",
  supervisor: "", // Для совместимости
  company: "",
  organization_id: undefined as number | undefined,
  grade: "",
  uni_sup_id: undefined as number | undefined,
  company_sup_id: undefined as number | undefined,
  uniSupervisorName: "",
  companySupervisorName: "",
};

export const AddEditPracticeModal: React.FC<AddEditModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
  api,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Режим редактирования
  const isEditMode = !!initialData;
  const isCompleted = initialData?.status === 'completed';

  // Состояния для автокомплита
  const [studentSuggestions, setStudentSuggestions] = useState<any[]>([]);
  const [universitySuggestions, setUniversitySuggestions] = useState<any[]>([]);
  const [facultySuggestions, setFacultySuggestions] = useState<any[]>([]);
  const [orgSuggestions, setOrgSuggestions] = useState<any[]>([]);
  const [uniSupSuggestions, setUniSupSuggestions] = useState<any[]>([]);
  const [companySupSuggestions, setCompanySupSuggestions] = useState<any[]>([]);
  const [searchTimers, setSearchTimers] = useState<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      if (initialData) {
        // Заполняем форму данными
        const { id, dateAdded, ...rest } = initialData;
        setFormData({
            ...rest,
            // Гарантируем, что поля определены
            uniSupervisorName: initialData.uniSupervisorName || "",
            companySupervisorName: initialData.companySupervisorName || "",
            grade: initialData.grade ? initialData.grade.toString() : "",
            organization_id: initialData.organization_id,
        } as any);
      } else {
        // Сбрасываем форму
        setFormData({
          ...emptyForm,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        } as any);
      }
      // Очистка списков подсказок
      setStudentSuggestions([]); setUniversitySuggestions([]); setFacultySuggestions([]);
      setOrgSuggestions([]); setUniSupSuggestions([]); setCompanySupSuggestions([]);
    }
  }, [isOpen, initialData]);

  // Функция поиска с задержкой
  const searchWithDebounce = async (type: string, query: string, searchFn?: (q: string) => Promise<any>, setSuggestions?: any) => {
    if (!searchFn || !setSuggestions || query.length < 1) return;
    if (searchTimers[type]) clearTimeout(searchTimers[type]);
    const timer = setTimeout(async () => {
      try {
        const results = await searchFn(query);
        setSuggestions(results || []);
      } catch (err) { console.error(err); }
    }, 300);
    setSearchTimers(prev => ({ ...prev, [type]: timer }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);

    // Запускаем поиск только если можно редактировать
    if (!isEditMode) {
      if (field === 'studentName') searchWithDebounce('student', value, api?.searchStudents, setStudentSuggestions);
      if (field === 'university') searchWithDebounce('university', value, api?.searchUniversities, setUniversitySuggestions);
      if (field === 'faculty') searchWithDebounce('faculty', value, api?.searchFaculties, setFacultySuggestions);
      if (field === 'company') searchWithDebounce('company', value, api?.searchOrganizations, setOrgSuggestions);
      if (field === 'uniSupervisorName') searchWithDebounce('uniSup', value, api?.searchSupervisors, setUniSupSuggestions);
      if (field === 'companySupervisorName') searchWithDebounce('compSup', value, api?.searchSupervisors, setCompanySupSuggestions);
    }
  };

  const handleSelectSuggestion = (type: string, item: any) => {
      if (type === 'student') {
        setFormData(prev => ({ ...prev, studentName: item.name, student_id: item.id, university: item.university || "", faculty: item.faculty || "" }));
        setStudentSuggestions([]);
      }
      if (type === 'university') { setFormData(prev => ({...prev, university: item.univercity})); setUniversitySuggestions([]); }
      if (type === 'faculty') { setFormData(prev => ({...prev, faculty: item.department})); setFacultySuggestions([]); }
      if (type === 'company') { setFormData(prev => ({...prev, company: item.name, organization_id: item.id})); setOrgSuggestions([]); }
      if (type === 'uniSup') { setFormData(prev => ({...prev, uniSupervisorName: item.name, uni_sup_id: item.id})); setUniSupSuggestions([]); }
      if (type === 'compSup') { setFormData(prev => ({...prev, companySupervisorName: item.name, company_sup_id: item.id})); setCompanySupSuggestions([]); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Проверка обязательных полей
    if (
      !formData.studentName ||
      !formData.university ||
      !formData.faculty ||
      !formData.startDate ||
      !formData.endDate 
    ) {
      setError("Пожалуйста, заполните все обязательные поля (*)");
      return;
    }

    // 2. Валидация Организации (обязательна только для производственной)
    if (formData.practiceType === "industrial" && !formData.company.trim()) {
      setError("Для производственной практики поле 'Организация' обязательно!");
      return;
    }
    
    // 3. Валидация ID (только при создании)
    if (!isEditMode && !formData.uni_sup_id) {
        setError("Выберите руководителя от университета из списка!");
        return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        // Если поле организации пустое, шлем undefined
        organization_id: formData.company ? formData.organization_id : undefined,
        company_sup_id: formData.company_sup_id || undefined,
      };

      // Ждем ответа от сервера
      await onSubmit(submitData);
      
      onClose(); // Закрываем только при успехе
      
    } catch (err: any) {
      console.error("Ошибка в модалке:", err);
      setError(err.message || "Произошла ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { return () => Object.values(searchTimers).forEach(t => clearTimeout(t)); }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <button className="close-icon" onClick={onClose}><Icons.Close /></button>
        <div className="modal-header">
          <h2>{isEditMode ? "Редактировать практику" : "Добавить новую практику"}</h2>
          <p>{isEditMode ? "Измените информацию о практике" : "Заполните информацию о практике студента"}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid">
            
            {/* ОШИБКА */}
            {error && (
              <div style={{ gridColumn: "1 / -1", backgroundColor: "#ffebee", color: "#c62828", padding: "12px", borderRadius: "8px", border: "1px solid #ef9a9a" }}>
                ⚠️ {error}
              </div>
            )}

            {/* ФИО Студента */}
            <div className="form-group full" style={{position: 'relative'}}>
              <label className="form-label">ФИО студента*</label>
              <input type="text" value={formData.studentName} onChange={e => handleChange("studentName", e.target.value)}
                required disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} placeholder="Иванов Иван Иванович" />
              {!isEditMode && studentSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {studentSuggestions.map(s => <div key={s.id} className="suggestion-item" onClick={() => handleSelectSuggestion('student', s)}>{s.name}</div>)}
                </div>
              )}
            </div>

            <div className="form-group" style={{position: 'relative'}}>
              <label className="form-label">Учебное заведение*</label>
              <input type="text" value={formData.university} onChange={e => handleChange("university", e.target.value)} 
                required disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} />
               {!isEditMode && universitySuggestions.length > 0 && (
                 <div className="suggestions-dropdown">
                   {universitySuggestions.map((u,i) => <div key={i} className="suggestion-item" onClick={() => handleSelectSuggestion('university', u)}>{u.univercity}</div>)}
                 </div>
              )}
            </div>

            <div className="form-group" style={{position: 'relative'}}>
               <label className="form-label">Факультет*</label>
               <input type="text" value={formData.faculty} onChange={e => handleChange("faculty", e.target.value)} 
                 required disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} />
                {!isEditMode && facultySuggestions.length > 0 && (
                 <div className="suggestions-dropdown">
                   {facultySuggestions.map((f,i) => <div key={i} className="suggestion-item" onClick={() => handleSelectSuggestion('faculty', f)}>{f.department}</div>)}
                 </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Вид практики*</label>
              <select value={formData.practiceType} onChange={e => handleChange("practiceType", e.target.value)}
                disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""}>
                <option value="industrial">Производственная</option>
                <option value="educational">Учебная</option>
                <option value="postgraduate">Преддипломная</option>
              </select>
            </div>

            {/* Организация - без звездочки */}
            <div className="form-group" style={{position: 'relative'}}>
              <label className="form-label">Организация</label>
              <input type="text" value={formData.company} onChange={e => handleChange("company", e.target.value)}
                disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} placeholder="Для производственной - обязательно" />
               {!isEditMode && orgSuggestions.length > 0 && (
                 <div className="suggestions-dropdown">
                   {orgSuggestions.map(o => <div key={o.id} className="suggestion-item" onClick={() => handleSelectSuggestion('company', o)}>{o.name}</div>)}
                 </div>
              )}
            </div>

            {/* Руководители */}
            <div className="form-group" style={{position: 'relative'}}>
              <label className="form-label">Руководитель от ВУЗа*</label>
              <input type="text" value={(formData as any).uniSupervisorName || ""} onChange={e => handleChange("uniSupervisorName", e.target.value)}
                required disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} />
                {!isEditMode && uniSupSuggestions.length > 0 && (
                 <div className="suggestions-dropdown">
                   {uniSupSuggestions.map(s => <div key={s.id} className="suggestion-item" onClick={() => handleSelectSuggestion('uniSup', s)}>{s.name}</div>)}
                 </div>
              )}
            </div>

            <div className="form-group" style={{position: 'relative'}}>
              <label className="form-label">Руководитель от Компании*</label>
              <input type="text" value={(formData as any).companySupervisorName || ""} onChange={e => handleChange("companySupervisorName", e.target.value)}
                disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} />
                {!isEditMode && companySupSuggestions.length > 0 && (
                 <div className="suggestions-dropdown">
                   {companySupSuggestions.map(s => <div key={s.id} className="suggestion-item" onClick={() => handleSelectSuggestion('compSup', s)}>{s.name}</div>)}
                 </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Дата начала*</label>
              <input type="date" value={formData.startDate} onChange={e => handleChange("startDate", e.target.value)} 
                disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} required />
            </div>
            <div className="form-group">
              <label className="form-label">Дата окончания*</label>
              <input type="date" value={formData.endDate} onChange={e => handleChange("endDate", e.target.value)} 
                disabled={isEditMode || loading} className={isEditMode ? "input-disabled" : ""} required />
            </div>

            {/* СТАТУС - редактируемый */}
            <div className="form-group">
              <label className="form-label">Статус*</label>
              <select value={formData.status} onChange={e => handleChange("status", e.target.value)}
                disabled={isCompleted || loading} className={isCompleted ? "input-disabled" : ""}>
                <option value="pending">Планируется / В процессе</option>
                <option value="completed">Завершена</option>
              </select>
            </div>

            {/* ОЦЕНКА - без звездочки, редактируемая */}
            <div className="form-group">
              <label className="form-label">Оценка</label>
              <input type="text" value={formData.grade} onChange={e => handleChange("grade", e.target.value)}
                placeholder="5" disabled={isCompleted || loading} className={isCompleted ? "input-disabled" : ""} />
            </div>
          </div>

          <div className="modal-footer">
            {isCompleted ? (
              <button type="button" className="btn-secondary" onClick={onClose}>Закрыть</button>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Сохранение..." : (isEditMode ? "Сохранить изменения" : "Добавить практику")}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, initialFilters, api }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [loading, setLoading] = useState(false);
  
  // Состояния для подсказок
  const [universitySuggestions, setUniversitySuggestions] = useState<Array<{ univercity: string }>>([]);
  const [facultySuggestions, setFacultySuggestions] = useState<Array<{ department: string }>>([]);
  const [studentSuggestions, setStudentSuggestions] = useState<Array<{ id: number; name: string }>>([]);
  const [orgSuggestions, setOrgSuggestions] = useState<Array<{ id: number; name: string }>>([]);

  const [searchTimers, setSearchTimers] = useState<Record<string, NodeJS.Timeout>>({});

  useEffect(() => { if (isOpen) setFilters(initialFilters); }, [isOpen, initialFilters]);

  // Универсальная функция поиска для фильтра
  const searchWithDebounce = async (type: string, query: string, searchFn?: (q: string) => Promise<any>, setSuggestions?: any) => {
    if (!searchFn || !setSuggestions || query.length < 1) {
      setSuggestions([]);
      return;
    }
    if (searchTimers[type]) clearTimeout(searchTimers[type]);
    
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await searchFn(query);
        setSuggestions(results || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }, 300);
    
    setSearchTimers(prev => ({ ...prev, [type]: timer }));
  };

  // Обработчики ввода
  const handleUniversityChange = (val: string) => {
    setFilters({ ...filters, university: val });
    searchWithDebounce('uni', val, api?.searchUniversities, setUniversitySuggestions);
  };

  const handleFacultyChange = (val: string) => {
    setFilters({ ...filters, faculty: val });
    searchWithDebounce('fac', val, api?.searchFaculties, setFacultySuggestions);
  };

  const handleStudentChange = (val: string) => {
    // Сбрасываем ID при изменении текста, чтобы поиск шел корректно
    setFilters({ ...filters, studentName: val, student_id: "" });
    searchWithDebounce('stud', val, api?.searchStudents, setStudentSuggestions);
  };

  const handleOrgChange = (val: string) => {
    setFilters({ ...filters, company: val });
    searchWithDebounce('org', val, api?.searchOrganizations, setOrgSuggestions);
  };

  const handleApply = () => { onApply(filters); onClose(); };
  
  const handleReset = () => {
    setFilters({ year: "", status: "", type: "", university: "", faculty: "", studentName: "", company: "", student_id: "" });
  };

  useEffect(() => { return () => Object.values(searchTimers).forEach(t => clearTimeout(t)); }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>Расширенная фильтрация</h2>
          <p>Настройте параметры для точного поиска</p>
        </div>
        <div className="modal-body">
          <div className="filter-section-title">Временные параметры</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Год практики</label>
              <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
                <option value="">Все годы</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div className="form-group">
              <label>Статус</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">Все статусы</option>
                <option value="pending">Планируется</option>
                <option value="completed">Завершена</option>
              </select>
            </div>
            <div className="form-group">
              <label>Вид практики</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">Все виды</option>
                <option value="industrial">Производственная</option>
                <option value="educational">Учебная</option>
                <option value="postgraduate">Преддипломная</option>
              </select>
            </div>
          </div>

          <div className="filter-section-title">Образовательные программы</div>
          <div className="form-grid">
            {/* ВУЗ */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Учебное заведение</label>
              <input type="text" value={filters.university} placeholder="Начните вводить..."
                onChange={(e) => handleUniversityChange(e.target.value)} />
              {universitySuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {universitySuggestions.map((uni, i) => (
                    <div key={i} className="suggestion-item" onClick={() => { 
                      setFilters({ ...filters, university: uni.univercity }); 
                      setUniversitySuggestions([]); 
                    }}>{uni.univercity}</div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Факультет */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Факультет</label>
              <input type="text" value={filters.faculty} placeholder="Начните вводить..."
                onChange={(e) => handleFacultyChange(e.target.value)} />
              {facultySuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {facultySuggestions.map((f, i) => (
                    <div key={i} className="suggestion-item" onClick={() => { 
                      setFilters({ ...filters, faculty: f.department }); 
                      setFacultySuggestions([]); 
                    }}>{f.department}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Организация */}
          <div className="form-group full" style={{marginTop: '10px', position: 'relative'}}>
            <label>Организация</label>
            <input type="text" placeholder="Введите организацию..." value={filters.company || ""} 
              onChange={(e) => handleOrgChange(e.target.value)} />
            {orgSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {orgSuggestions.map((o, i) => (
                    <div key={i} className="suggestion-item" onClick={() => { 
                      setFilters({ ...filters, company: o.name }); 
                      setOrgSuggestions([]); 
                    }}>{o.name}</div>
                  ))}
                </div>
            )}
          </div>

          {/* Поиск по студенту (ТЕПЕРЬ С АВТОКОМПЛИТОМ И ID) */}
          <div className="filter-section-title">Поиск по студенту</div>
          <div className="form-group full" style={{ position: 'relative' }}>
            <label>ФИО студента</label>
            <input type="text" placeholder="Введите имя..." value={filters.studentName} 
              onChange={(e) => handleStudentChange(e.target.value)} />
            {studentSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {studentSuggestions.map((s) => (
                    <div key={s.id} className="suggestion-item" onClick={() => { 
                      // ВАЖНО: Устанавливаем и имя (для отображения), и ID (для API)
                      setFilters({ ...filters, studentName: s.name, student_id: s.id.toString() }); 
                      setStudentSuggestions([]); 
                    }}>{s.name}</div>
                  ))}
                </div>
            )}
          </div>
          
          <div style={{ marginTop: '20px', background: '#f9f9f9', borderRadius: '6px' }}>
            <button type="button" onClick={handleReset} style={{ background: 'transparent', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', color: '#666', fontSize: '14px' }}>
              Сбросить все фильтры
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleApply}>Применить фильтры</button>
        </div>
      </div>
    </div>
  );
};