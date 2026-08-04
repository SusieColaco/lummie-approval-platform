import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Upload PDF para Supabase Storage
export async function uploadFile(
  projectId: string,
  fileType: 'brand_book' | 'raio_x' | 'briefing',
  file: File
) {
  const fileName = `${projectId}/${fileType}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('lummie-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  return {
    path: data.path,
    size: file.size,
    name: file.name,
  }
}

// Obter URL pública do arquivo
export function getFileUrl(filePath: string) {
  const { data } = supabase.storage
    .from('lummie-files')
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Deletar arquivo
export async function deleteFile(filePath: string) {
  const { error } = await supabase.storage
    .from('lummie-files')
    .remove([filePath])

  if (error) throw error
}

// Salvar referência do arquivo no banco
export async function saveFileReference(
  projectId: number,
  fileType: 'brand_book' | 'raio_x' | 'briefing',
  filePath: string,
  fileName: string,
  fileSize: number,
  uploadedBy: string
) {
  const { data, error } = await supabase
    .from('files')
    .upsert({
      project_id: projectId,
      type: fileType,
      file_path: filePath,
      name: fileName,
      file_size: fileSize,
      uploaded_by: uploadedBy,
    })
    .select()

  if (error) throw error
  return data
}

// Obter arquivos do projeto
export async function getProjectFiles(projectId: number) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)

  if (error) throw error
  return data
}

// Salvar feedback de cliente
export async function saveFeedback(
  scriptId: number,
  projectId: number,
  approvalStatus: 'aprovado' | 'reprovado' | 'alteracao',
  notes: string
) {
  const { data, error } = await supabase
    .from('feedback')
    .insert({
      script_id: scriptId,
      project_id: projectId,
      approval_status: approvalStatus,
      notes: notes,
    })
    .select()

  if (error) throw error
  return data
}
