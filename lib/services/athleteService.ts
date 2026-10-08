import { readDB, writeDB, Athlete } from '../db/store';

// Helper to validate Brazilian CPF
export function validateCPF(cpfInput: string): boolean {
  const cleanCPF = cpfInput.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // Exclude simple repeated sequences
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validate 1st verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let firstDigit = remainder === 10 || remainder === 11 ? 0 : remainder;
  if (firstDigit !== parseInt(cleanCPF.charAt(9))) return false;

  // Validate 2nd verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let secondDigit = remainder === 10 || remainder === 11 ? 0 : remainder;
  if (secondDigit !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

export const athleteService = {
  getAll(): Athlete[] {
    const db = readDB();
    return db.athletes;
  },

  getById(id: string): Athlete | null {
    const db = readDB();
    return db.athletes.find(a => a.id === id) || null;
  },

  getByCpf(cpf: string): Athlete | null {
    const db = readDB();
    const cleanCPF = cpf.replace(/\D/g, '');
    return db.athletes.find(a => a.cpf === cleanCPF) || null;
  },

  create(data: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; data?: Athlete; error?: string; code?: number } {
    const db = readDB();
    const cleanCPF = data.cpf.replace(/\D/g, '');

    // 1. CPF is required and must be validated
    if (!cleanCPF) {
      return { success: false, error: 'CPF é obrigatório.', code: 400 };
    }
    if (!validateCPF(cleanCPF)) {
      return { success: false, error: 'CPF inválido! Digite corretamente o número do documento.', code: 400 };
    }

    // 2. CPF must be unique globally
    const existing = db.athletes.find(a => a.cpf === cleanCPF);
    if (existing) {
      return { success: false, error: 'Atleta com este CPF já está cadastrado globalmente.', code: 409 };
    }

    // 3. Name validation
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: 'Nome do atleta deve conter no mínimo 3 caracteres.', code: 400 };
    }

    const newAthlete: Athlete = {
      id: 'ath-' + Math.random().toString(36).substring(2, 11),
      cpf: cleanCPF,
      name: data.name.trim(),
      birthDate: data.birthDate,
      gender: data.gender || 'MISTO',
      phone: data.phone.replace(/\D/g, ''),
      email: data.email,
      photo: data.photo,
      status: data.status || 'ATIVO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.athletes.push(newAthlete);
    writeDB(db);

    return { success: true, data: newAthlete };
  },

  update(id: string, data: Partial<Omit<Athlete, 'id' | 'cpf' | 'createdAt' | 'updatedAt'>>): { success: boolean; data?: Athlete; error?: string; code?: number } {
    const db = readDB();
    const index = db.athletes.findIndex(a => a.id === id);

    if (index === -1) {
      return { success: false, error: 'Atleta não encontrado.', code: 404 };
    }

    // Note: CPF cannot be updated here as requested (Rule: CPF não pode ser alterado pelo endpoint comum de atualização do atleta)
    
    // Validate name if provided
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length < 3) {
        return { success: false, error: 'Nome do atleta deve conter no mínimo 3 caracteres.', code: 400 };
      }
      db.athletes[index].name = data.name.trim();
    }

    if (data.birthDate !== undefined) db.athletes[index].birthDate = data.birthDate;
    if (data.gender !== undefined) db.athletes[index].gender = data.gender;
    if (data.phone !== undefined) db.athletes[index].phone = data.phone.replace(/\D/g, '');
    if (data.email !== undefined) db.athletes[index].email = data.email;
    if (data.photo !== undefined) db.athletes[index].photo = data.photo;
    if (data.status !== undefined) db.athletes[index].status = data.status;

    db.athletes[index].updatedAt = new Date().toISOString();
    writeDB(db);

    return { success: true, data: db.athletes[index] };
  }
};
