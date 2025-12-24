import { Practice, PracticeType, FilterState, ApiResponse, ApiPractice } from '../types';

const API_BASE_URL = 'http://localhost:8080';

/**
 * Класс для взаимодействия с REST API сервера.
 * Реализует паттерн Singleton.
 */
class PracticeApi {
  
  /**
   * Приватный метод для выполнения HTTP-запросов.
   * Обрабатывает ошибки сети и статусы ответов API.
   * @param endpoint - URL пути (например, '/GetPractice')
   * @param options - параметры fetch (метод, тело и т.д.)
   */
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
    }

    if (!response.ok || (data && data.status === 'error')) {
      const errorMessage = data.error || data.message || `Ошибка запроса: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return data as T;
  }

  // --- Публичные методы получения данных ---

  /** Получает топ-3 последних практик для главной страницы */
  async getTop3(): Promise<Practice[]> {
    const response = await this.fetchApi<ApiResponse<any>>('/GetTop3');
    
    return response.rows.map(row => ({
      id: row.id,
      student_id: row.id,
      studentName: row.name,
      practiceType: row.practice_type as PracticeType,
      university: '',
      faculty: '',
      year: new Date().getFullYear().toString(),
      company: row.org,
      grade: '',
      status: this.mapStatus(row.res),
      startDate: '',
      endDate: '',
    }));
  }

  /** * Получает список практик с учетом фильтрации.
   * Формирует GET-параметры для отправки на сервер.
   */
  async getPractices(filters: FilterState): Promise<Practice[]> {
    const params = new URLSearchParams();
    
    if (filters.year) params.append('ContextYear', filters.year);
    if (filters.status) params.append('ContextStatus', filters.status === 'completed' ? 'true' : 'false');
    if (filters.type) params.append('ContextType', this.mapPracticeTypeToBackend(filters.type));
    if (filters.university) params.append('ContextUni', filters.university);
    if (filters.company) params.append('ContextOrg', filters.company);
    if (filters.faculty) params.append('ContextDepart', filters.faculty);
    if (filters.studentName) params.append('ContextStudentName', filters.studentName.toLowerCase());
    
    params.append('SortOrder', 'date,DESC');
    
    const response = await this.fetchApi<ApiResponse<ApiPractice>>(`/GetPractice?${params}`);
    
    return response.rows.map(practice => ({
      id: practice.id,
      student_id: practice.student_id,
      studentName: practice.student_name,
      practiceType: this.mapPracticeTypeFromBackend(practice.type),
      university: practice.university,
      faculty: practice.department,
      year: new Date(practice.start_date).getFullYear().toString(),
      company: practice.org?.toString() || '-',
      grade: practice.grade?.toString() || '',
      status: practice.is_completed ? 'completed' : 'pending',
      startDate: practice.start_date,
      endDate: practice.end_date,
      dateAdded: practice.start_date,
      uniSupervisorName: practice.uni_sup_name || '',
      companySupervisorName: practice.company_sup_name || '',
      uni_sup_id: practice.uni_sup_id,
      company_sup_id: practice.company_sup_id,
      organization_id: practice.org_id
    }));
  }

  // --- Методы изменения данных ---

  /** Создает новую запись о практике */
  async createPractice(practiceData: any): Promise<{ status: string }> {
    const backendData = {
      student_id: practiceData.student_id,
      organization_id: practiceData.organization_id || null,
      uni_sup_id: practiceData.uni_sup_id || null,
      company_sup_id: practiceData.company_sup_id || null,
      practice_type: this.mapPracticeTypeToBackend(practiceData.practiceType),
      start_date: practiceData.startDate,
      end_date: practiceData.endDate,
      grade: practiceData.grade || null,
      is_completed: practiceData.status === 'completed' ? 'true' : 'false',
    };
    
    return this.fetchApi<{ status: string }>('/PostPractice', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
  }

  /** Обновляет оценку практики */
  async updateGrade(practiceId: number, grade: string): Promise<{ status: string }> {
    return this.fetchApi<{ status: string }>('/PatchGrade', {
      method: 'PATCH',
      body: JSON.stringify({
        id: practiceId.toString(),
        grade: grade,
      }),
    });
  }

  /** Завершает практику (ставит флаг is_completed) */
  async completePractice(practiceId: number): Promise<{ status: string }> {
    return this.fetchApi<{ status: string }>('/PatchComplete', {
      method: 'PATCH',
      body: JSON.stringify({
        id: practiceId.toString(),
      }),
    });
  }

  // --- Методы поиска для автокомплита ---

  async searchStudents(query: string): Promise<Array<{ id: number; name: string; university: string; faculty: string }>> {
    const response = await this.fetchApi<ApiResponse<{ id: number; name: string; univercity: string; department: string }>>(
      `/GetNameStudent?ContextName=${encodeURIComponent(query)}`
    );
    return response.rows.map(row => ({
      id: row.id,
      name: row.name,
      university: row.univercity, // Исправление опечатки бэкенда
      faculty: row.department
    }));
  }

  async searchUniversities(query: string): Promise<Array<{ univercity: string }>> {
    const response = await this.fetchApi<ApiResponse<{ univercity: string }>>(
      `/GetNameUni?ContextUni=${encodeURIComponent(query)}`
    );
    return response.rows;
  }

  async searchFaculties(query: string): Promise<Array<{ department: string }>> {
    const response = await this.fetchApi<ApiResponse<{ department: string }>>(
      `/GetNameDep?ContextDep=${encodeURIComponent(query)}`
    );
    return response.rows;
  }

  async searchSupervisors(query: string): Promise<Array<{ id: number; name: string }>> {
    const response = await this.fetchApi<ApiResponse<{ id: number; name: string }>>(
      `/GetNameSup?ContextSup=${encodeURIComponent(query)}`
    );
    return response.rows;
  }

  async searchOrganizations(query: string): Promise<Array<{ id: number; name: string }>> {
    const response = await this.fetchApi<ApiResponse<{ id: number; name: string }>>(
      `/GetNameOrg?ContextOrg=${encodeURIComponent(query)}`
    );
    return response.rows;
  }

  // --- Приватные утилиты маппинга ---

  private mapStatus(res: string): 'completed' | 'pending' {
    switch (res) {
      case 'done':
      case 'completed': return 'completed';
      default: return 'pending';
    }
  }

  private mapPracticeTypeToBackend(type: string): string {
    const mapping: Record<string, string> = {
      'industrial': 'industrial',
      'educational': 'educational',
      'postgraduate': 'postgraduate'
    };
    return mapping[type] || 'industrial';
  }

  private mapPracticeTypeFromBackend(type: string): PracticeType {
    const mapping: Record<string, PracticeType> = {
      'industrial': 'industrial',
      'educational': 'educational',
      'postgraduate': 'postgraduate'
    };
    return mapping[type] || 'industrial';
  }
}

export const practiceApi = new PracticeApi();