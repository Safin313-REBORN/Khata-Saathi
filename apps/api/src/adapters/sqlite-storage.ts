import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertIntegerAmount,
  type Customer,
  type Storage,
  type Transaction,
} from '@khata-saathi/core';

export class SqliteStorage implements Storage {
  readonly providerName = 'sqlite';
  readonly isStub = false;
  private db: Database.Database;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shop_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        shop_name TEXT NOT NULL,
        location TEXT NOT NULL
      );

      INSERT OR IGNORE INTO shop_meta (id, shop_name, location)
      VALUES (1, 'Rizwan General Store', 'Sahiwal');

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        due_days INTEGER NOT NULL DEFAULT 14,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL REFERENCES customers(id),
        type TEXT NOT NULL CHECK (type IN ('udhaar', 'wapis', 'adjustment')),
        amount INTEGER NOT NULL CHECK (amount > 0),
        direction INTEGER,
        note TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        reversed_tx_id TEXT,
        source_text TEXT,
        adjustment_reason TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_tx_customer ON transactions(customer_id, occurred_at);
    `);
  }

  async getShopMeta(): Promise<{ shopName: string; location: string }> {
    const row = this.db
      .prepare('SELECT shop_name, location FROM shop_meta WHERE id = 1')
      .get() as { shop_name: string; location: string } | undefined;
    return {
      shopName: row?.shop_name ?? 'Rizwan General Store',
      location: row?.location ?? 'Sahiwal',
    };
  }

  async listCustomers(): Promise<Customer[]> {
    const rows = this.db
      .prepare('SELECT id, name, phone, due_days, created_at FROM customers ORDER BY name ASC')
      .all() as Array<{
        id: string;
        name: string;
        phone: string | null;
        due_days: number;
        created_at: string;
      }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      dueDays: r.due_days,
      createdAt: r.created_at,
    }));
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const r = this.db
      .prepare('SELECT id, name, phone, due_days, created_at FROM customers WHERE id = ?')
      .get(id) as
      | { id: string; name: string; phone: string | null; due_days: number; created_at: string }
      | undefined;
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      dueDays: r.due_days,
      createdAt: r.created_at,
    };
  }

  async createCustomer(input: { name: string; phone?: string | null; dueDays?: number }): Promise<Customer> {
    const customer: Customer = {
      id: `cust_${crypto.randomUUID().slice(0, 8)}`,
      name: input.name.trim(),
      phone: input.phone ?? null,
      dueDays: input.dueDays ?? 14,
      createdAt: new Date().toISOString(),
    };
    this.db
      .prepare('INSERT INTO customers (id, name, phone, due_days, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(customer.id, customer.name, customer.phone, customer.dueDays, customer.createdAt);
    return customer;
  }

  async listTransactions(customerId?: string): Promise<Transaction[]> {
    const sql = customerId
      ? 'SELECT * FROM transactions WHERE customer_id = ? ORDER BY occurred_at ASC, created_at ASC'
      : 'SELECT * FROM transactions ORDER BY occurred_at ASC, created_at ASC';
    const rows = (customerId ? this.db.prepare(sql).all(customerId) : this.db.prepare(sql).all()) as Array<{
      id: string;
      customer_id: string;
      type: Transaction['type'];
      amount: number;
      direction: 1 | -1 | null;
      note: string;
      occurred_at: string;
      created_at: string;
      reversed_tx_id: string | null;
      source_text: string | null;
      adjustment_reason: string | null;
    }>;

    return rows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      type: r.type,
      amount: r.amount,
      direction: r.direction ?? undefined,
      note: r.note,
      occurredAt: r.occurred_at,
      createdAt: r.created_at,
      reversedTxId: r.reversed_tx_id,
      sourceText: r.source_text,
      adjustmentReason: r.adjustment_reason,
    }));
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const r = this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as
      | {
          id: string;
          customer_id: string;
          type: Transaction['type'];
          amount: number;
          direction: 1 | -1 | null;
          note: string;
          occurred_at: string;
          created_at: string;
          reversed_tx_id: string | null;
          source_text: string | null;
          adjustment_reason: string | null;
        }
      | undefined;
    if (!r) return null;
    return {
      id: r.id,
      customerId: r.customer_id,
      type: r.type,
      amount: r.amount,
      direction: r.direction ?? undefined,
      note: r.note,
      occurredAt: r.occurred_at,
      createdAt: r.created_at,
      reversedTxId: r.reversed_tx_id,
      sourceText: r.source_text,
      adjustmentReason: r.adjustment_reason,
    };
  }

  async appendTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    assertIntegerAmount(tx.amount, 'transaction amount');
    const record: Transaction = {
      ...tx,
      id: `tx_${crypto.randomUUID().slice(0, 10)}`,
      createdAt: new Date().toISOString(),
    };
    this.db
      .prepare(
        `INSERT INTO transactions
         (id, customer_id, type, amount, direction, note, occurred_at, created_at, reversed_tx_id, source_text, adjustment_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.id,
        record.customerId,
        record.type,
        record.amount,
        record.direction ?? null,
        record.note,
        record.occurredAt,
        record.createdAt,
        record.reversedTxId ?? null,
        record.sourceText ?? null,
        record.adjustmentReason ?? null
      );
    return record;
  }

  async clearAll(): Promise<void> {
    this.db.exec('DELETE FROM transactions; DELETE FROM customers;');
  }

  close() {
    this.db.close();
  }
}
