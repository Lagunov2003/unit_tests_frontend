import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RegistryView } from "../components/views/RegistryView";
import { Practice } from "../types/index";


// Мокаем иконки и StatusBadge
jest.mock("../components/icons", () => ({
  Icons: {
    Filter: () => <span data-testid="filter-icon">🔍</span>,
    Edit: () => <span data-testid="edit-icon">✏️</span>,
  },
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge" data-status={status}>
      {status === "completed" ? "Завершена" : "Планируется"}
    </span>
  ),
}))

describe("RegistryView - основные тесты", () => {
    const mockPractices: Practice[] = [
      {
        id: 1,
        studentName: "Иванов Иван",
        university: "МГУ",
        faculty: "Информатика",
        practiceType: "industrial",
        company: "Яндекс",
        status: "pending",
        grade: "5",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        student_id: 123,
        year: "2024",
        supervisor: "Тест",
        organization_id: 456,
        uni_sup_id: 789,
        company_sup_id: 999,
        uniSupervisorName: "Тест",
        companySupervisorName: "Тест",
        dateAdded: "2024-01-01T00:00:00Z",
      },
    ];
  
    const mockOnOpenFilter = jest.fn();
    const mockOnEdit = jest.fn();
  
    beforeEach(() => {
      jest.clearAllMocks();
      window.addEventListener = jest.fn();
    });
  
    it("должен отображать заголовок и количество записей", () => {
      render(
        <RegistryView 
          practices={mockPractices}
          onOpenFilter={mockOnOpenFilter}
          onEdit={mockOnEdit}
        />
      );
      
      expect(screen.getByText("Список практик")).toBeInTheDocument();
      expect(screen.getByText("Найдено записей: 1")).toBeInTheDocument();
    });
  
    it("должен отображать данные практики", () => {
      render(
        <RegistryView 
          practices={mockPractices}
          onOpenFilter={mockOnOpenFilter}
          onEdit={mockOnEdit}
        />
      );
      
      expect(screen.getByText("Иванов Иван")).toBeInTheDocument();
      expect(screen.getByText("МГУ")).toBeInTheDocument();
      expect(screen.getByText("Информатика")).toBeInTheDocument();
      expect(screen.getByText("Производственная")).toBeInTheDocument();
      expect(screen.getByText("Яндекс")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  
    it("должен вызывать onOpenFilter при клике на фильтр", () => {
      render(
        <RegistryView 
          practices={mockPractices}
          onOpenFilter={mockOnOpenFilter}
          onEdit={mockOnEdit}
        />
      );
      
      const filterButton = screen.getByRole("button", { name: /фильтрация/i });
      fireEvent.click(filterButton);
      
      expect(mockOnOpenFilter).toHaveBeenCalledTimes(1);
    });
  
    it("должен вызывать onEdit при клике на редактирование", () => {
      render(
        <RegistryView 
          practices={mockPractices}
          onOpenFilter={mockOnOpenFilter}
          onEdit={mockOnEdit}
        />
      );
      
      const editButton = screen.getByTestId("edit-icon");
      fireEvent.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockPractices[0]);
    });
  
    it("должен показывать сообщение при пустом списке", () => {
      render(
        <RegistryView 
          practices={[]}
          onOpenFilter={mockOnOpenFilter}
          onEdit={mockOnEdit}
        />
      );
      
      expect(screen.getByText("По вашим фильтрам ничего не найдено")).toBeInTheDocument();
    });
  });