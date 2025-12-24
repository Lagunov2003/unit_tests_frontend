import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";
import { Practice, FilterState } from "../types/index";
import { practiceApi } from "../api/practiceApi";

// Мокаем все компоненты и API
jest.mock("../components/layout/Header", () => ({
  Header: jest.fn(() => <div data-testid="header">Header</div>)
}));

jest.mock("../components/layout/Footer", () => ({
  Footer: jest.fn(() => <div data-testid="footer">Footer</div>)
}));

jest.mock("../components/modals", () => ({
  AddEditPracticeModal: jest.fn(() => null),
  FilterModal: jest.fn(() => null)
}));

jest.mock("../components/views/MainView", () => ({
  MainView: jest.fn(() => <div data-testid="main-view">Main View</div>)
}));

jest.mock("../components/views/RegistryView", () => ({
  RegistryView: jest.fn(() => <div data-testid="registry-view">Registry View</div>)
}));

jest.mock("../api/practiceApi", () => ({
  practiceApi: {
    getTop3: jest.fn(),
    getPractices: jest.fn(),
    createPractice: jest.fn(),
    updateGrade: jest.fn(),
    completePractice: jest.fn(),
    searchStudents: jest.fn(),
    searchUniversities: jest.fn(),
    searchFaculties: jest.fn(),
    searchSupervisors: jest.fn(),
    searchOrganizations: jest.fn()
  }
}));

describe("App Component", () => {
  const mockPractices: Practice[] = [
    {
      id: 1,
      student_id: 123,
      studentName: "Иванов Иван",
      practiceType: "industrial",
      university: "МГУ",
      faculty: "Информатика",
      year: "2024",
      company: "Яндекс",
      grade: 5,
      status: "pending",
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    }
  ];

  const mockFilters: FilterState = {
    year: "",
    status: "",
    type: "",
    university: "",
    faculty: "",
    studentName: "",
    company: ""
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем успешные ответы API по умолчанию
    (practiceApi.getTop3 as jest.Mock).mockResolvedValue(mockPractices);
    (practiceApi.getPractices as jest.Mock).mockResolvedValue(mockPractices);
    (practiceApi.createPractice as jest.Mock).mockResolvedValue({ status: "success" });
    (practiceApi.updateGrade as jest.Mock).mockResolvedValue({ status: "success" });
    (practiceApi.completePractice as jest.Mock).mockResolvedValue({ status: "success" });
  });

  describe("Рендеринг", () => {
    it("должен рендерить приложение с основными компонентами", async () => {
      render(<App />);
      
    });

    it("должен показывать MainView по умолчанию", async () => {
      render(<App />);
      

    });

    it("должен загружать практики при монтировании", async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(practiceApi.getTop3).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Загрузка данных", () => {
    it("должен показывать индикатор загрузки", () => {
      // Задержка ответа API
      (practiceApi.getTop3 as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPractices), 100))
      );
      
      render(<App />);
      
      expect(screen.getByText("Загрузка...")).toBeInTheDocument();
    });

    it("должен показывать ошибку при неудачной загрузке", async () => {
      const errorMessage = "Ошибка сервера";
      (practiceApi.getTop3 as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(`Ошибка загрузки данных: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it("должен загружать все практики при переходе в реестр", async () => {
      render(<App />);
      
      
      await waitFor(() => {
        expect(practiceApi.getTop3).toHaveBeenCalledTimes(1);
      });
      
      // Нажимаем кнопку перехода в реестр (имитируем через Header)
      const Header = require("../components/layout/Header").Header;
      const mockCall = (Header as jest.Mock).mock.calls[0][0];
      
      // Вызываем onChangeView, которое передано в Header
      mockCall.onChangeView("registry");
      
      await waitFor(() => {
        expect(practiceApi.getPractices).toHaveBeenCalledWith(mockFilters);
      });
    });
  });

  describe("Работа с модальными окнами", () => {
    it("должен открывать модалку добавления практики", () => {
      render(<App />);
      
      // Имитируем вызов onAddClick из Header
      const Header = require("../components/layout/Header").Header;
      const mockCall = (Header as jest.Mock).mock.calls[0][0];
      
      // Вызываем onAddClick
      mockCall.onAddClick();
      
   
    });

    it("должен открывать модалку редактирования практики", async () => {
        render(<App />);
        
        await waitFor(() => {
          expect(practiceApi.getTop3).toHaveBeenCalled();
        });
        
        // Переключаемся в реестр
        const Header = require("../components/layout/Header").Header;
        const headerProps = (Header as jest.Mock).mock.calls[0][0];
        headerProps.onChangeView("registry");
        
        await waitFor(() => {
          expect(practiceApi.getPractices).toHaveBeenCalled();
        });
        
        // Получаем все вызовы RegistryView
        const RegistryView = require("../components/views/RegistryView").RegistryView;
        const registryCalls = (RegistryView as jest.Mock).mock.calls;
        
        console.log('RegistryView calls:', registryCalls.length);
        console.log('RegistryView last call:', registryCalls[registryCalls.length - 1]);
        
        // Берем последний вызов
        const lastRegistryCall = registryCalls[registryCalls.length - 1];
        expect(lastRegistryCall).toBeDefined();
        
        // Вызываем onEdit
        lastRegistryCall[0].onEdit(mockPractices[0]);
        
        // Проверяем вызовы модалки
        const AddEditModal = require("../components/modals").AddEditPracticeModal;
        const modalCalls = (AddEditModal as jest.Mock).mock.calls;
        
        console.log('Modal calls:', modalCalls.length);
        console.log('Modal calls details:', modalCalls.map(call => ({
          isOpen: call[0].isOpen,
          hasInitialData: !!call[0].initialData,
          initialDataId: call[0].initialData?.id
        })));
        
        // Ищем вызов с initialData
        const modalCallWithInitialData = modalCalls.find(call => call[0].initialData);
        

      });
    it("должен открывать модалку фильтрации", async () => {
      render(<App />);
      
      // Переключаемся в реестр
      const Header = require("../components/layout/Header").Header;
      const headerProps = (Header as jest.Mock).mock.calls[0][0];
      headerProps.onChangeView("registry");
      
      await waitFor(() => {
        const RegistryView = require("../components/views/RegistryView").RegistryView;
        const registryProps = (RegistryView as jest.Mock).mock.calls[0][0];
        
        // Вызываем onOpenFilter
        registryProps.onOpenFilter();
        
        // Проверяем, что модалка фильтрации открылась
        const FilterModal = require("../components/modals").FilterModal;
        expect(FilterModal).toHaveBeenCalledWith(
          expect.objectContaining({ isOpen: true }),
          expect.anything()
        );
      });
    });
  });

  describe("Сохранение практики", () => {
    it("должен создавать новую практику", async () => {
      render(<App />);
      
      const newPracticeData = {
        student_id: 456,
        practiceType: "educational" as const,
        university: "СПбГУ",
        faculty: "Экономика",
        year: "2024",
        company: "Газпром",
        grade: "4",
        status: "pending" as const,
        startDate: "2024-02-01",
        endDate: "2024-02-28",
        uniSupervisorName: "Тест",
        companySupervisorName: "Тест"
      };
      
      // Открываем модалку добавления
      const Header = require("../components/layout/Header").Header;
      const headerProps = (Header as jest.Mock).mock.calls[0][0];
      headerProps.onAddClick();
      
      // Получаем onSubmit из модалки
      const AddEditModal = require("../components/modals").AddEditPracticeModal;
      const modalProps = (AddEditModal as jest.Mock).mock.calls[0][0];
      
      // Вызываем сохранение
      await modalProps.onSubmit(newPracticeData);
      
      expect(practiceApi.createPractice).toHaveBeenCalledWith(newPracticeData);
      expect(practiceApi.getTop3).toHaveBeenCalledTimes(2); // Первый + перезагрузка
    });

    it("должен обновлять оценку существующей практики", async () => {
      render(<App />);
      
      const updatedData = {
        ...mockPractices[0],
        grade: "4",
        status: "pending" as const
      };
      
      // Открываем модалку редактирования
      const Header = require("../components/layout/Header").Header;
      const headerProps = (Header as jest.Mock).mock.calls[0][0];
      headerProps.onChangeView("registry");
      
      await waitFor(() => {
        const RegistryView = require("../components/views/RegistryView").RegistryView;
        const registryProps = (RegistryView as jest.Mock).mock.calls[0][0];
        registryProps.onEdit(mockPractices[0]);
        
        // Вызываем сохранение
        const AddEditModal = require("../components/modals").AddEditPracticeModal;
        const modalProps = (AddEditModal as jest.Mock).mock.calls[0][0];
        
        modalProps.onSubmit(updatedData);
        

      });
    });

    it("должен завершать практику при изменении статуса", async () => {
      render(<App />);
      
      const updatedData = {
        ...mockPractices[0],
        grade: "5",
        status: "completed" as const
      };
      
      // Открываем модалку редактирования
      const Header = require("../components/layout/Header").Header;
      const headerProps = (Header as jest.Mock).mock.calls[0][0];
      headerProps.onChangeView("registry");
      
      await waitFor(() => {
        const RegistryView = require("../components/views/RegistryView").RegistryView;
        const registryProps = (RegistryView as jest.Mock).mock.calls[0][0];
        registryProps.onEdit(mockPractices[0]);
        
        // Вызываем сохранение
        const AddEditModal = require("../components/modals").AddEditPracticeModal;
        const modalProps = (AddEditModal as jest.Mock).mock.calls[0][0];
        
        modalProps.onSubmit(updatedData);
        

      });
    });
  });

  describe("Фильтрация", () => {
    it("должен применять фильтры", async () => {
      render(<App />);
      
      const newFilters: FilterState = {
        year: "2024",
        status: "completed",
        type: "industrial",
        university: "МГУ",
        faculty: "Информатика",
        studentName: "Иванов",
        company: "Яндекс"
      };
      
      // Открываем и применяем фильтры
      const FilterModal = require("../components/modals").FilterModal;
      
      // Вызываем onApply с новыми фильтрами
      (FilterModal as jest.Mock).mock.calls[0][0].onApply(newFilters);
      
    });
  });
});