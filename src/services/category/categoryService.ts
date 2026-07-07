import { supabase } from '@/lib/supabase/client';
import { CategoryType } from '../../types';
import { isNoRowsError, toUserFacingQueryError } from '@/utils/errorHandling';

export const categoryService = {
  async getCategories(): Promise<CategoryType[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw toUserFacingQueryError('Categories', error);
      }

      return data as CategoryType[];
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Categories', {});
    }
  },

  async getCategoryById(id: number): Promise<CategoryType | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (isNoRowsError(error)) {
          return null;
        }
        throw toUserFacingQueryError('Category', error);
      }

      return data as CategoryType;
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Category', {});
    }
  },

  async createCategory(name: string, description?: string): Promise<CategoryType> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, description: description || '' })
        .select()
        .single();

      if (error) {
        throw toUserFacingQueryError('Category', error);
      }

      return data as CategoryType;
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Category', {});
    }
  },

  async getOrCreateCategory(name: string): Promise<CategoryType> {
    try {
      const normalized = name.trim();
      if (!normalized) throw new Error('Category name is required');

      const { data: existing, error: findError } = await supabase
        .from('categories')
        .select('*')
        .ilike('name', normalized)
        .maybeSingle();

      if (findError) throw toUserFacingQueryError('Category', findError);
      if (existing) return existing as CategoryType;

      return this.createCategory(normalized);
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Category', {});
    }
  },
};
