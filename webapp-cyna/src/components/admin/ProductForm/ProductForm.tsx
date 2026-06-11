'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProduct } from '@/app/(admin)/admin/_actions/product.actions'
import styles from './ProductForm.module.scss'

type Category = {
  id_categorie: number
  cat_nom: string
}

const productSchema = z.object({
  nom_pro: z.string().min(1, 'Le nom est obligatoire'),
  pro_description: z.string().min(1, 'La description est obligatoire'),
  pro_carac_technique: z.string().optional(),
  id_categorie: z.number({ error: 'La catégorie est obligatoire' }),
  prix: z
    .number({ error: 'Le prix est obligatoire' })
    .positive('Le prix doit être supérieur à 0'),
  type_facturation: z.enum(['mensuel', 'annuel', 'unique'], {
    error: 'Le type de facturation est obligatoire',
  }),
})

type ProductFormData = z.infer<typeof productSchema>

export default function ProductForm({ categories }: { categories: Category[] }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      await createProduct(data)
      alert('Produit créé !')
    } catch (error) {
      alert('Erreur lors de la création')
    }
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <Label htmlFor="nom_pro">Nom du produit</Label>
        <Input id="nom_pro" {...register('nom_pro')} />
        {errors.nom_pro && (
          <span className={styles.error}>{errors.nom_pro.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label htmlFor="pro_description">Description</Label>
        <Input id="pro_description" {...register('pro_description')} />
        {errors.pro_description && (
          <span className={styles.error}>{errors.pro_description.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label htmlFor="pro_carac_technique">Caractéristiques techniques</Label>
        <Input id="pro_carac_technique" {...register('pro_carac_technique')} />
      </div>

      <div className={styles.field}>
        <Label htmlFor="prix">Prix (€)</Label>
        <Input
          id="prix"
          type="number"
          step="0.01"
          {...register('prix', { valueAsNumber: true })}
        />
        {errors.prix && (
          <span className={styles.error}>{errors.prix.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label>Facturation</Label>
        <Select
          onValueChange={(value) =>
            setValue('type_facturation', value as ProductFormData['type_facturation'])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un type de facturation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensuel">Mensuel</SelectItem>
            <SelectItem value="annuel">Annuel</SelectItem>
            <SelectItem value="unique">Paiement unique</SelectItem>
          </SelectContent>
        </Select>
        {errors.type_facturation && (
          <span className={styles.error}>{errors.type_facturation.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <Label>Catégorie</Label>
        <Select onValueChange={(value) => setValue('id_categorie', Number(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id_categorie} value={String(cat.id_categorie)}>
                {cat.cat_nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.id_categorie && (
          <span className={styles.error}>{errors.id_categorie.message}</span>
        )}
      </div>

      <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
        {isSubmitting ? 'Création...' : 'Créer le produit'}
      </Button>
    </div>
  )
}