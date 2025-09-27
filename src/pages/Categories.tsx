import { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useCategories } from '@/hooks/useCategories';
import { CategoryDialog } from '@/components/forms/CategoryDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export default function Categories() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSubmit = async (name: string) => {
    if (editingCategory) {
      return await updateCategory(editingCategory.id, name);
    } else {
      return await createCategory(name);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('categories.title')}</h1>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('categories.addNew')}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border" dir={direction}>
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-card-foreground">{t('categories.header')}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('categories.name')}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('categories.created')}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-border">
                    <td className="px-6 py-4 text-sm text-card-foreground font-medium">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-8 px-3"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                          {t('common.edit')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 px-3"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                      {t('categories.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={editingCategory}
          onSubmit={handleSubmit}
          title={editingCategory ? t('categories.editTitle') : t('categories.createTitle')}
          description={editingCategory ? t('categories.editDescription') : t('categories.createDescription')}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir={direction}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('categories.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('categories.deleteConfirmDescription', { name: categoryToDelete?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}