import { render, screen, fireEvent } from "@testing-library/react";
import { MainView } from "../components/views/MainView";
import { Practice } from "../types/index";

// Мокаем StatusBadge 
jest.mock("../components/icons", () => ({
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  )
}));

describe("MainView Component", () => {
  // Моковые данные для практик
  const mockPractices: Practice[] = [
    {
      id: 1,
      studentName: "Иванов Иван Иванович",
      company: "Яндекс",
      status: "pending",
      student_id: 123,
      practiceType: "industrial",
      university: "МГУ",
      faculty: "Факультет информатики",
      year: "2024",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      supervisor: "Петров П.П.",
      organization_id: 456,
      grade: "5",
      uni_sup_id: 789,
      company_sup_id: 999,
      uniSupervisorName: "Сидоров С.С.",
      companySupervisorName: "Кузнецов К.К.",
      dateAdded: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      studentName: "Петров Петр Петрович",
      company: "Газпром",
      status: "completed",
      student_id: 124,
      practiceType: "educational",
      university: "СПбГУ",
      faculty: "Экономический",
      year: "2024",
      startDate: "2024-02-01",
      endDate: "2024-02-28",
      supervisor: "Иванов И.И.",
      organization_id: 457,
      grade: "4",
      uni_sup_id: 790,
      company_sup_id: 1000,
      uniSupervisorName: "Алексеев А.А.",
      companySupervisorName: "Борисов Б.Б.",
      dateAdded: "2024-01-02T00:00:00Z",
    },
    {
      id: 3,
      studentName: "Сидоров Сидор Сидорович",
      company: "Сбер",
      status: "pending",
      student_id: 125,
      practiceType: "postgraduate",
      university: "МФТИ",
      faculty: "Физтех",
      year: "2024",
      startDate: "2024-03-01",
      endDate: "2024-03-31",
      supervisor: "Васильев В.В.",
      organization_id: 458,
      grade: "5",
      uni_sup_id: 791,
      company_sup_id: 1001,
      uniSupervisorName: "Григорьев Г.Г.",
      companySupervisorName: "Дмитриев Д.Д.",
      dateAdded: "2024-01-03T00:00:00Z",
    },
    {
      id: 4,
      studentName: "Четвертый Студент",
      company: "Тинькофф",
      status: "completed",
      student_id: 126,
      practiceType: "industrial",
      university: "ВШЭ",
      faculty: "Бизнес-информатика",
      year: "2024",
      startDate: "2024-04-01",
      endDate: "2024-04-30",
      supervisor: "Егоров Е.Е.",
      organization_id: 459,
      grade: "4",
      uni_sup_id: 792,
      company_sup_id: 1002,
      uniSupervisorName: "Жуков Ж.Ж.",
      companySupervisorName: "Зайцев З.З.",
      dateAdded: "2024-01-04T00:00:00Z",
    },
  ];

  beforeEach(() => {
    // Мокаем window.innerWidth и addEventListener/removeEventListener
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Десктоп по умолчанию
    });
    
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Рендеринг контента", () => {
    it("должен отображать заголовок и описание системы", () => {
      render(<MainView practices={mockPractices} />);
      
      expect(screen.getByText("Единая система управления практиками")).toBeInTheDocument();
      expect(screen.getByText(/официальный реестр мест прохождения/i)).toBeInTheDocument();
    });

    it("должен отображать заголовок 'Последние добавленные практики'", () => {
      render(<MainView practices={mockPractices} />);
      
      expect(screen.getByText("Последние добавленные практики")).toBeInTheDocument();
    });

    it("должен отображать только первые 3 практики", () => {
      render(<MainView practices={mockPractices} />);
      
      // Должны отобразиться только первые 3 практики
      expect(screen.getByText("Иванов Иван Иванович")).toBeInTheDocument();
      expect(screen.getByText("Петров Петр Петрович")).toBeInTheDocument();
      expect(screen.getByText("Сидоров Сидор Сидорович")).toBeInTheDocument();
      
      // Четвертая практика не должна отображаться
      expect(screen.queryByText("Четвертый Студент")).not.toBeInTheDocument();
    });

    it("должен отображать ФИО студентов и компании", () => {
      render(<MainView practices={mockPractices} />);
      
      expect(screen.getByText("Иванов Иван Иванович")).toBeInTheDocument();
      expect(screen.getByText("Яндекс")).toBeInTheDocument();
      expect(screen.getByText("Петров Петр Петрович")).toBeInTheDocument();
      expect(screen.getByText("Газпром")).toBeInTheDocument();
    });

    it("должен использовать компонент StatusBadge для отображения статуса", () => {
      render(<MainView practices={mockPractices} />);
      
      const statusBadges = screen.getAllByTestId("status-badge");
      expect(statusBadges).toHaveLength(3);
      expect(statusBadges[0]).toHaveTextContent("pending");
      expect(statusBadges[1]).toHaveTextContent("completed");
    });
  });

  

  describe("Edge cases", () => {
    it("должен корректно обрабатывать пустой массив практик", () => {
      render(<MainView practices={[]} />);
      
      // Заголовок и описание должны отображаться
      expect(screen.getByText("Единая система управления практиками")).toBeInTheDocument();
      expect(screen.getByText("Последние добавленные практики")).toBeInTheDocument();
      
      // Не должно быть элементов практик
      const practiceRows = document.querySelectorAll('.practice-row-main');
      expect(practiceRows.length).toBe(0);
    });

    it("должен корректно обрабатывать массив с 1-2 практиками", () => {
      const fewPractices = mockPractices.slice(0, 2);
      render(<MainView practices={fewPractices} />);
      
      expect(screen.getByText("Иванов Иван Иванович")).toBeInTheDocument();
      expect(screen.getByText("Петров Петр Петрович")).toBeInTheDocument();
      expect(screen.queryByText("Сидоров Сидор Сидорович")).not.toBeInTheDocument();
    });

    it("должен корректно отображать практики без компании", () => {
      const practicesWithoutCompany = [
        {
          ...mockPractices[0],
          company: "", // Пустая компания
        },
      ];
      
      render(<MainView practices={practicesWithoutCompany} />);
      
      expect(screen.getByText("Иванов Иван Иванович")).toBeInTheDocument();
      // Компания не отображается, но компонент не должен падать
    });
  });

  describe("Интеграция с StatusBadge", () => {
    it("должен передавать правильный статус в компонент StatusBadge", () => {
      render(<MainView practices={mockPractices} />);
      
      const statusBadges = screen.getAllByTestId("status-badge");
      
      // Проверяем, что статусы передаются правильно
      expect(statusBadges[0]).toHaveTextContent("pending");
      expect(statusBadges[1]).toHaveTextContent("completed");
      expect(statusBadges[2]).toHaveTextContent("pending");
    });
  });
});