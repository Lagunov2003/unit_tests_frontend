/**
 * Основные типы для системы управления практиками
 */

export type PracticeStatus = "completed" | "pending";
export type PracticeType = "postgraduate" | "educational" | "industrial";

/**
 * Основной интерфейс практики для фронтенда
 * Включает маппинг полей из БД и дополнительные поля для UI
 */
export interface Practice {
  id: number;
  student_id: number;
  studentName: string;
  practiceType: PracticeType;
  university: string;
  faculty: string;
  year: string;
  company: string;
  grade: number | string;
  status: PracticeStatus;
  startDate: string;
  endDate: string;
  supervisor?: string;
  organization_id?: number;
  uni_sup_id?: number;
  uniSupervisorName?: string;
  companySupervisorName?: string;
  company_sup_id?: number;
  dateAdded?: string;
}

/**
 * Состояние фильтров для поиска практик
 */
export interface FilterState {
  year: string;
  status: string;
  type: string;
  university: string;
  faculty: string;
  studentName: string;
  company: string;
  student_id?: string;
  organization_id?: string;
}

/**
 * Базовый интерфейс для всех API ответов
 */
export interface ApiResponse<T> {
  status: "success" | "error";
  error?: string;
  count_rows: number;
  rows: T[];
}

/**
 * Интерфейс практики от API (соответствует бэкенду)
 */
export interface ApiPractice {
  id: number;
  student_id: number;
  student_name: string;
  university: string;
  department: string;
  type: PracticeType;
  is_completed: boolean;
  org?: string;
  grade: number | null;
  start_date: string;
  end_date: string;
  uni_sup_name?: string;
  company_sup_name?: string;
  uni_sup_id?: number;
  company_sup_id?: number;
  org_id?: number;
}