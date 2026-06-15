'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createCategory, updateCategory } from '@/app/(admin)/admin/_actions/category.actions'
import styles from './CategoryForm.module.scss'

const categorySchema = z.object({
  cat_nom: z.string().min(1, 'Le nom est obligatoire'),
  cat_description: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function CategoryForm({ 
  category 
}: { 
  category?: { id_categorie: number; cat_nom: string; cat_description: string | null } 
} = {}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      cat_nom: category.cat_nom,
      cat_description: category.cat_description || '',
    } : undefined,
  })

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (category) {
        await updateCategory(category.id_categorie, data)
      } else {
        await createCategory(data)
      }
      router.push('/admin/categories')
    } catch {
      alert('Erreur lors de la modification')
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <Label htmlFor="cat_nom">Nom de la catégorie</Label>
        <Input id="cat_nom" {...register('cat_nom')} />
        {errors.cat_nom && (
          <span className={styles.error}>{errors.cat_nom.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label htmlFor="cat_description">Description</Label>
        <Input id="cat_description" {...register('cat_description')} />
      </div>

      <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
        {isSubmitting ? 'Modification...' : category ? 'Modifier' : 'Créer la catégorie'}
      </Button>
    </div>
  )
}
