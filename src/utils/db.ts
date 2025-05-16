import mysql from 'mysql2/promise';
import CONFIG from '../config/config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const pool = mysql.createPool({
  host: CONFIG.DB.HOST,
  user: CONFIG.DB.USER,
  password: CONFIG.DB.PASSWORD,
  database: CONFIG.DB.NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export async function queryPaginated<T extends RowDataPacket>(
  baseSql: string,
  options: PaginationOptions,
  params: any[] = [],
  allowedSortFields: string[] = []
): Promise<PaginatedResult<T>> {
  const { page, limit, sortBy, sortOrder } = options;
  const offset = (page - 1) * limit;

  // Validate and sanitize sort field
  let orderClause = '';
  if (sortBy && allowedSortFields.includes(sortBy)) {
    const safeOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    orderClause = ` ORDER BY ${sortBy} ${safeOrder}`;
  }

  // Count total records
  const countSql = `SELECT COUNT(*) as total FROM (${baseSql}) as subquery`;
  const [countResult] = await pool.execute(countSql, params);
  const total = (countResult as any)[0].total;

  // Get paginated data
  const paginatedSql = `${baseSql}${orderClause} LIMIT ? OFFSET ?`;
  const paginatedParams = [...params, limit, offset];
  const [rows] = await pool.execute(paginatedSql, paginatedParams);

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows as T[],
    total,
    page,
    totalPages,
    hasMore: page < totalPages
  };
}

export async function query<T extends RowDataPacket>(
  sql: string, 
  params?: any[]
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function execute(
  sql: string, 
  params?: any[]
): Promise<ResultSetHeader> {
  try {
    const [result] = await pool.execute(sql, params);
    return result as ResultSetHeader;
  } catch (error) {
    console.error('Database execution error:', error);
    throw error;
  }
}

export async function withTransaction<T>(callback: (connection: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
} 