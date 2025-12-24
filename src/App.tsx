import React, { useState, useMemo, useEffect } from "react";
import "./styles.css";
import { Practice, FilterState } from "./types";
import { practiceApi } from "./api/practiceApi";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { AddEditPracticeModal, FilterModal } from "./components/modals";
import { MainView } from "./components/views/MainView";
import { RegistryView } from "./components/views/RegistryView";

// --- MAIN APP ---

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "registry">("home");
  const [practicesList, setPracticesList] = useState<Practice[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    year: "", status: "", type: "", university: "", faculty: "", studentName: "", company: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadPractices(); }, [currentView, filters]);

  const loadPractices = async () => {
    try {
      setLoading(true);
      setError(null);
      if (currentView === "home") {
        const top3 = await practiceApi.getTop3();
        setPracticesList(top3);
      } else {
        const allPractices = await practiceApi.getPractices(filters);
        setPracticesList(allPractices);
      }
    } catch (err: any) {
      setError("Ошибка загрузки данных: " + (err.message || "Неизвестная ошибка"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPractices = useMemo(() => {
    if (currentView === "home") return practicesList.slice(0, 3);
    return practicesList; 
  }, [practicesList, currentView]);

  const handleOpenAdd = () => { setEditingPractice(null); setModalOpen(true); };
  const handleOpenEdit = (practice: Practice) => { setEditingPractice(practice); setModalOpen(true); };

  // Здесь убран try/catch, чтобы ошибки летели в модалку
  const handleSavePractice = async (data: Omit<Practice, "id" | "dateAdded">) => {
    if (editingPractice) {
      // Обновление
      if (data.grade !== editingPractice.grade) {
        await practiceApi.updateGrade(editingPractice.id, data.grade.toString());
      }
      if (data.status === 'completed' && editingPractice.status !== 'completed') {
          await practiceApi.completePractice(editingPractice.id);
      }
      setPracticesList((prev) => 
        prev.map((p) => p.id === editingPractice.id ? { ...p, ...data } : p)
      );
    } else {
      // Создание
      const result = await practiceApi.createPractice(data);
      if (result.status === 'success') {
        await loadPractices();
      }
    }
  };

  return (
    <div className="app-wrapper">
      <Header currentView={currentView} onChangeView={setCurrentView} onAddClick={handleOpenAdd} />
      <div className="page-body">
        <main className="main-content container">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#d32f2f' }}>{error}</div>
          ) : currentView === "home" ? (
            <MainView practices={filteredPractices} />
          ) : (
            <RegistryView 
              practices={filteredPractices} 
              onOpenFilter={() => setFilterOpen(true)} 
              onEdit={handleOpenEdit}
            />
          )}
        </main>
      </div>
      
      {/* Передаем функцию навигации в футер */}
      <Footer onChangeView={setCurrentView} />
      
      <AddEditPracticeModal 
        isOpen={isModalOpen} 
        initialData={editingPractice} 
        onClose={() => setModalOpen(false)} 
        onSubmit={handleSavePractice} 
        api={{
          searchStudents: practiceApi.searchStudents.bind(practiceApi),
          searchUniversities: practiceApi.searchUniversities.bind(practiceApi),
          searchFaculties: practiceApi.searchFaculties.bind(practiceApi),
          searchSupervisors: practiceApi.searchSupervisors.bind(practiceApi),
          searchOrganizations: practiceApi.searchOrganizations.bind(practiceApi),
        }}
      />
      <FilterModal 
        isOpen={isFilterOpen} 
        onClose={() => setFilterOpen(false)} 
        initialFilters={filters} 
        onApply={setFilters} 
        api={{
          searchUniversities: practiceApi.searchUniversities.bind(practiceApi),
          searchFaculties: practiceApi.searchFaculties.bind(practiceApi),
          searchStudents: practiceApi.searchStudents.bind(practiceApi),
          searchOrganizations: practiceApi.searchOrganizations.bind(practiceApi),
        }}
      />
    </div>
  );
}

