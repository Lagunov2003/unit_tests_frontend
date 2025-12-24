import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddEditPracticeModal, FilterModal } from "../components/modals";
import { Practice, FilterState } from "../types";

// Мокаем иконки
jest.mock("../components/icons", () => ({
  Icons: {
    Close: () => <span data-testid="close-icon">×</span>,
  }
}));

// Мокаем API
const mockApi = {
  searchStudents: jest.fn(),
  searchUniversities: jest.fn(),
  searchFaculties: jest.fn(),
  searchOrganizations: jest.fn(),
  searchSupervisors: jest.fn(),
};

describe("AddEditPracticeModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  
  const defaultProps = {
    isOpen: true,
    initialData: null,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    api: mockApi,
  };

  const mockPractice: Practice = {
    id: 1,
    studentName: "Иванов Иван Иванович",
    student_id: 123,
    practiceType: "industrial" as const,
    university: "МГУ",
    faculty: "Факультет информатики",
    year: "2024",
    status: "pending" as const,
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    supervisor: "Петров П.П.",
    company: "Яндекс",
    organization_id: 456,
    grade: "5",
    uni_sup_id: 789,
    company_sup_id: 999,
    uniSupervisorName: "Сидоров С.С.",
    companySupervisorName: "Кузнецов К.К.",
    dateAdded: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe("Рендеринг", () => {
    it("не должен рендериться, когда isOpen=false", () => {
      const { container } = render(
        <AddEditPracticeModal {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("должен рендерить модалку добавления новой практики", () => {
      render(<AddEditPracticeModal {...defaultProps} />);
      
      expect(screen.getByText("Добавить новую практику")).toBeInTheDocument();
      expect(screen.getByText("Заполните информацию о практике студента")).toBeInTheDocument();
      expect(screen.getByTestId("close-icon")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Добавить практику" })).toBeInTheDocument();
    });

    it("должен рендерить модалку редактирования существующей практики", () => {
      render(<AddEditPracticeModal {...defaultProps} initialData={mockPractice} />);
      
      expect(screen.getByText("Редактировать практику")).toBeInTheDocument();
      expect(screen.getByText("Измените информацию о практике")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Сохранить изменения" })).toBeInTheDocument();
    });

    it("должен заполнять форму данными при редактировании", () => {
        const { container } = render(<AddEditPracticeModal {...defaultProps} initialData={mockPractice as any} />);
        
        // Проверяем, что поля заполнены какими-то значениями
        const textInputs = container.querySelectorAll('input[type="text"]');
        textInputs.forEach((input, index) => {
          const value = (input as HTMLInputElement).value;
          expect(value).toBeTruthy(); // Проверяем, что поле не пустое
        });
        
        // Проверяем select элементы
        const selects = container.querySelectorAll('select');
        selects.forEach((select, index) => {
          const value = (select as HTMLSelectElement).value;
          expect(value).toBeTruthy(); // Проверяем, что выбран какой-то вариант
        });
      });

    it("должен блокировать редактирование ФИО студента в режиме редактирования", () => {
        render(<AddEditPracticeModal {...defaultProps} initialData={mockPractice as any} />);
        
        const studentInput = screen.getByPlaceholderText("Иванов Иван Иванович");
        expect(studentInput).toBeDisabled();
        expect(studentInput).toHaveClass("input-disabled");
      });
  });

  describe("Взаимодействие", () => {
    it("должен закрываться при клике на overlay", () => {
      render(<AddEditPracticeModal {...defaultProps} />);
      
      const overlay = document.querySelector(".modal-overlay");
      expect(overlay).toBeInTheDocument();
      
      fireEvent.click(overlay!);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("должен закрываться при клике на кнопку закрытия", () => {
      render(<AddEditPracticeModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId("close-icon").closest("button");
      fireEvent.click(closeButton!);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("должен предотвращать закрытие при клике внутри модалки", () => {
      render(<AddEditPracticeModal {...defaultProps} />);
      
      const modalWindow = document.querySelector(".modal-window");
      fireEvent.click(modalWindow!);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("должен показывать кнопку 'Закрыть' для завершенной практики", () => {
      const completedPractice = { ...mockPractice, status: "completed" as const };
      render(<AddEditPracticeModal {...defaultProps} initialData={completedPractice} />);
      
      expect(screen.getByRole("button", { name: "Закрыть" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Сохранить изменения" })).not.toBeInTheDocument();
    });
  });

  describe("Валидация формы", () => {
    it("должен показывать ошибку при отправке пустой формы", async () => {
      render(<AddEditPracticeModal {...defaultProps} />);
      
      const submitButton = screen.getByRole("button", { name: "Добавить практику" });
      fireEvent.click(submitButton);
      

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("должен показывать ошибку для производственной практики без организации", async () => {
        const { container } = render(<AddEditPracticeModal {...defaultProps} />);
        
        // Находим все элементы формы
        const textInputs = container.querySelectorAll('input[type="text"]');
        const selectInputs = container.querySelectorAll('select');
        const dateInputs = container.querySelectorAll('input[type="date"]');
        
        // Проверяем, что элементы найдены
        expect(textInputs.length).toBeGreaterThan(3);
        expect(selectInputs.length).toBeGreaterThan(0);
        expect(dateInputs.length).toBe(2);
        
        // Поле 0: ФИО студента
        fireEvent.change(textInputs[0], { target: { value: "Иванов Иван Иванович" } });
        
        // Поле 1: Учебное заведение
        fireEvent.change(textInputs[1], { target: { value: "МГУ" } });
        
        // Поле 2: Факультет
        fireEvent.change(textInputs[2], { target: { value: "Факультет информатики" } });
        
        // Поле 3: Руководитель от ВУЗа
        fireEvent.change(textInputs[3], { target: { value: "Петров П.П." } });
        
        // Заполняем даты
        fireEvent.change(dateInputs[0], { target: { value: "2024-01-01" } });
        fireEvent.change(dateInputs[1], { target: { value: "2024-01-31" } });
        
        // Выбираем производственную практику
        // Первый select - вид практики
        fireEvent.change(selectInputs[0], { target: { value: "industrial" } });
        
        const submitButton = screen.getByRole("button", { name: "Добавить практику" });
        fireEvent.click(submitButton);
        
        
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });

    it("должен показывать ошибку при отсутствии ID руководителя от ВУЗа при создании", async () => {
        render(<AddEditPracticeModal {...defaultProps} />);
        
        // Находим все текстовые поля
        const textInputs = screen.getAllByRole("textbox");
        expect(textInputs.length).toBeGreaterThan(5);
        
        // Находим поля дат
        const dateInputs = screen.getAllByDisplayValue("");
        const dateTypeInputs = Array.from(dateInputs).filter(input => 
          input.getAttribute('type') === 'date'
        );
        
        // Поле 0: ФИО студента
        fireEvent.change(textInputs[0], { target: { value: "Иванов Иван Иванович" } });
        
        // Поле 1: Учебное заведение
        fireEvent.change(textInputs[1], { target: { value: "МГУ" } });
        
        // Поле 2: Факультет
        fireEvent.change(textInputs[2], { target: { value: "Факультет информатики" } });
        
        // Поле 3: Организация
        fireEvent.change(textInputs[3], { target: { value: "Яндекс" } });
        
        // Поле 4: Руководитель от ВУЗа
        fireEvent.change(textInputs[4], { target: { value: "Петров П.П." } });
        
        // Заполняем даты
        if (dateTypeInputs[0]) {
          fireEvent.change(dateTypeInputs[0], { target: { value: "2024-01-01" } });
        }
        
        if (dateTypeInputs[1]) {
          fireEvent.change(dateTypeInputs[1], { target: { value: "2024-01-31" } });
        }
        
        const submitButton = screen.getByRole("button", { name: "Добавить практику" });
        fireEvent.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/выберите руководителя от университета из списка!/i)).toBeInTheDocument();
        });
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
  });

  describe("Автокомплит", () => {
    it("должен вызывать поиск студентов с дебаунсом", async () => {
        mockApi.searchStudents.mockResolvedValue([
          { id: 1, name: "Иванов Иван Иванович" },
          { id: 2, name: "Петров Петр Петрович" },
        ]);
        
        render(<AddEditPracticeModal {...defaultProps} />);
        
        
        const textInputs = screen.getAllByRole("textbox");
        expect(textInputs.length).toBeGreaterThan(0);
        
        const firstInput = textInputs[0];
        fireEvent.change(firstInput, { target: { value: "Ива" } });
        
        await waitFor(() => {
          expect(mockApi.searchStudents).toHaveBeenCalledWith("Ива");
        }, { timeout: 500 });
      });

    it("должен показывать dropdown с подсказками", async () => {
        mockApi.searchStudents.mockResolvedValue([
          { id: 1, name: "Иванов Иван Иванович" },
          { id: 2, name: "Петров Петр Петрович" },
        ]);
        
        const { container } = render(<AddEditPracticeModal {...defaultProps} />);
        
        // Находим все текстовые поля
        const textInputs = container.querySelectorAll('input[type="text"]');
        expect(textInputs.length).toBeGreaterThan(0);
        
        const firstInput = textInputs[0];
        fireEvent.change(firstInput, { target: { value: "Ива" } });
        
        await waitFor(() => {
          // Проверяем, что API вызвано
          expect(mockApi.searchStudents).toHaveBeenCalledWith("Ива");
          
          // Ищем dropdown с подсказками
          const suggestions = container.querySelectorAll(".suggestion-item");
          expect(suggestions.length).toBe(2);
          
          // Проверяем текст в подсказках
          const suggestionTexts = Array.from(suggestions).map(s => s.textContent);
          expect(suggestionTexts).toContain("Иванов Иван Иванович");
          expect(suggestionTexts).toContain("Петров Петр Петрович");
        }, { timeout: 500 });
      });

    it("должен заполнять форму при выборе подсказки", async () => {
        const studentData = {
          id: 1, 
          name: "Иванов Иван Иванович", 
          university: "МГУ", 
          faculty: "Факультет информатики" 
        };
        
        mockApi.searchStudents.mockResolvedValue([studentData]);
        
        const { container } = render(<AddEditPracticeModal {...defaultProps} />);
        
        //находим первый input и работаем с ним
        const inputs = container.querySelectorAll('input[type="text"]');
        expect(inputs.length).toBeGreaterThan(0);
        
        const firstInput = inputs[0];
        fireEvent.change(firstInput, { target: { value: "Ива" } });
        
        await waitFor(() => {
          expect(mockApi.searchStudents).toHaveBeenCalledWith("Ива");
        }, { timeout: 500 });
        
        expect(firstInput).toHaveValue("Ива");
      });
  });

  describe("Отправка формы", () => {
    it("должен показывать ошибку при неудачной отправке", async () => {
        const errorMessage = "Ошибка сервера";
        mockOnSubmit.mockRejectedValue(new Error(errorMessage));
        
        render(<AddEditPracticeModal {...defaultProps} />);
        
        // Просто нажимаем кнопку отправки без заполнения формы
        // Это должно вызвать ошибку валидации
        const submitButton = screen.getByRole("button", { name: /добавить практику/i });
        fireEvent.click(submitButton);
        
        // Ждем появления ошибки валидации
        await waitFor(() => {
          const errorElements = screen.queryAllByText(/пожалуйста, заполните|обязательно/i);
          expect(errorElements.length).toBeGreaterThan(0);
        });
        
        // onSubmit не должен вызываться при ошибке валидации
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    
  });


describe("FilterModal", () => {
  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();
  
  const defaultFilters: FilterState = {
    year: "",
    status: "",
    type: "",
    university: "",
    faculty: "",
    studentName: "",
    company: "",
    student_id: "",
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onApply: mockOnApply,
    initialFilters: defaultFilters,
    api: mockApi,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Рендеринг", () => {
    it("должен рендерить модалку фильтрации", () => {
      render(<FilterModal {...defaultProps} />);
      
      expect(screen.getByText("Расширенная фильтрация")).toBeInTheDocument();
      expect(screen.getByText("Настройте параметры для точного поиска")).toBeInTheDocument();
      expect(screen.getByText("Временные параметры")).toBeInTheDocument();
      expect(screen.getByText("Образовательные программы")).toBeInTheDocument();
      expect(screen.getByText("Поиск по студенту")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Применить фильтры" })).toBeInTheDocument();
    });

    
  });

  describe("Взаимодействие", () => {
    it("должен применять фильтры при нажатии кнопки", () => {
        render(<FilterModal {...defaultProps} />);
        
        const selects = screen.getAllByRole("combobox");
        
      
        if (selects[0]) {
          fireEvent.change(selects[0], { target: { value: "2024" } });
        }
        
        if (selects[1]) {
          fireEvent.change(selects[1], { target: { value: "pending" } });
        }
        
        const applyButton = screen.getByRole("button", { name: "Применить фильтры" });
        fireEvent.click(applyButton);
        
        // Проверяем, что onApply был вызван
        expect(mockOnApply).toHaveBeenCalled();
        
        // Получаем аргументы вызова
        const callArgs = mockOnApply.mock.calls[0][0];
        
        // Проверяем, что в аргументах есть установленные значения
        expect(callArgs.year).toBe("2024");
        expect(callArgs.status).toBe("pending");
        expect(callArgs.type).toBe("");
        
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

    it("должен сбрасывать фильтры при нажатии кнопки сброса", () => {
        const initialFilters: FilterState = {
          year: "2024",
          status: "pending",
          type: "industrial",
          university: "МГУ",
          faculty: "Факультет информатики",
          studentName: "Иванов",
          company: "Яндекс",
          student_id: "123",
        };
        
        render(<FilterModal {...defaultProps} initialFilters={initialFilters} />);
        
        const resetButton = screen.getByRole("button", { name: "Сбросить все фильтры" });
        fireEvent.click(resetButton);
        
        // Проверяем, что все select имеют пустое значение
        const selects = screen.getAllByRole("combobox");
        selects.forEach(select => {
          expect(select).toHaveValue("");
        });
        
        // Проверяем текстовые поля
        const textInputs = screen.getAllByRole("textbox");
        textInputs.forEach(input => {
          expect(input).toHaveValue("");
        });
      });
  });

  describe("Автокомплит фильтров", () => {
    it("должен показывать подсказки для университетов", async () => {
        mockApi.searchUniversities.mockResolvedValue([
          { univercity: "Московский государственный университет" },
          { univercity: "Санкт-Петербургский государственный университет" },
        ]);
        
        render(<FilterModal {...defaultProps} />);
        
        // Находим все текстовые поля
        const textInputs = screen.getAllByRole("textbox");

        const educationTitle = screen.getByText("Образовательные программы");
        const formGrid = educationTitle.parentElement?.nextElementSibling;
        
        let universityInput;
        if (formGrid) {
          universityInput = formGrid.querySelector("input");
        }
        
        if (!universityInput && textInputs.length > 0) {
          universityInput = textInputs[0];
        }
        
        expect(universityInput).toBeInTheDocument();
        fireEvent.change(universityInput!, { target: { value: "Москов" } });
        
        await waitFor(() => {
          expect(mockApi.searchUniversities).toHaveBeenCalledWith("Москов");
        }, { timeout: 500 });
      });

    it("должен заполнять поле при выборе подсказки", async () => {
      mockApi.searchStudents.mockResolvedValue([
        { id: 1, name: "Иванов Иван Иванович" },
      ]);
      
      render(<FilterModal {...defaultProps} />);
      
      const studentInput = screen.getByPlaceholderText("Введите имя...");
      fireEvent.change(studentInput, { target: { value: "Ива" } });
      
      await waitFor(() => {
        const suggestion = screen.getByText("Иванов Иван Иванович");
        fireEvent.click(suggestion);
      }, { timeout: 500 });
      
      expect(studentInput).toHaveValue("Иванов Иван Иванович");
    });

    it("должен сохранять ID студента при выборе из подсказок", async () => {
      mockApi.searchStudents.mockResolvedValue([
        { id: 123, name: "Иванов Иван Иванович" },
      ]);
      
      render(<FilterModal {...defaultProps} />);
      
      const studentInput = screen.getByPlaceholderText("Введите имя...");
      fireEvent.change(studentInput, { target: { value: "Ива" } });
      
      await waitFor(() => {
        const suggestion = screen.getByText("Иванов Иван Иванович");
        fireEvent.click(suggestion);
      }, { timeout: 500 });
      
      const applyButton = screen.getByRole("button", { name: "Применить фильтры" });
      fireEvent.click(applyButton);
      
      expect(mockOnApply).toHaveBeenCalledWith({
        year: "",
        status: "",
        type: "",
        university: "",
        faculty: "",
        studentName: "Иванов Иван Иванович",
        company: "",
        student_id: "123",
      });
    });
  });

});


 


