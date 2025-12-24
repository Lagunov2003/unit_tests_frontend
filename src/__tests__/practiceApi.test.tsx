import { practiceApi } from '../api/practiceApi';

global.fetch = jest.fn();

describe('PracticeApi - основные тесты', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен запрашивать практики с правильными параметрами', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', rows: [] })
    } as any);

    await practiceApi.getPractices({
      year: 2024,
      status: 'completed',
      type: 'industrial'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('ContextYear=2024'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('ContextStatus=true'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('ContextType=industrial'),
      expect.any(Object)
    );
  });

  it('должен создавать практику с правильными данными', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success' })
    } as any);

    await practiceApi.createPractice({
      student_id: 123,
      practiceType: 'industrial',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'pending'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/PostPractice',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"student_id":123')
      })
    );
  });

  it('должен искать студентов', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        rows: [{ id: 1, name: 'Иванов Иван', univercity: 'МГУ', department: 'Информатика' }]
      })
    } as any);

    const result = await practiceApi.searchStudents('Иванов');

    expect(result[0].name).toBe('Иванов Иван');
    expect(result[0].university).toBe('МГУ');
  });

  it('должен обрабатывать ошибки сервера', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 'error', error: 'Server error' })
    } as any);

    await expect(practiceApi.getTop3()).rejects.toThrow('Server error');
  });
});