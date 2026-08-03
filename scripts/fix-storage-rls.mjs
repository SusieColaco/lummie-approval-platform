import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dpaxhawnapjzzpvwvstq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7Slns0QK-VuWv2sw9K6fuw_ViR3RTK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStorageAccess() {
  console.log('🔍 Testando acesso ao Storage...\n');

  try {
    // Listar buckets
    console.log('1️⃣ Listando buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return;
    }

    console.log('✅ Buckets encontrados:');
    buckets?.forEach(b => {
      console.log(`   - ${b.name} (id: ${b.id}, public: ${b.public})`);
    });

    // Verificar bucket lummie-files
    const lummiesBucket = buckets?.find(b => b.name === 'lummie-files');
    if (!lummiesBucket) {
      console.log('\n❌ Bucket "lummie-files" não encontrado!');
      console.log('   Criando bucket...');

      const { data: newBucket, error: createError } = await supabase.storage.createBucket(
        'lummie-files',
        {
          public: false,
          allowedMimeTypes: ['application/pdf'],
        }
      );

      if (createError) {
        console.error('   ❌ Erro ao criar bucket:', createError);
      } else {
        console.log(`   ✅ Bucket criado: ${newBucket?.name}`);
      }
      return;
    }

    console.log(`\n2️⃣ Bucket "lummie-files" existe (public: ${lummiesBucket.public})`);

    // Tentar upload simples
    console.log('\n3️⃣ Tentando upload simples...');
    const testContent = new Uint8Array([37, 80, 68, 70]); // %PDF
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lummie-files')
      .upload('test/simple.pdf', testContent, {
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      console.log('\n⚠️ Solução possível:');
      console.log('   1. Acesse: https://dpaxhawnapjzzpvwvstq.supabase.co');
      console.log('   2. Vá para Storage > lummie-files');
      console.log('   3. Clique na aba "Policies"');
      console.log('   4. Crie uma policy que permita uploads');
      return;
    }

    console.log('✅ Upload bem-sucedido!');
    console.log(`   Path: ${uploadData.path}`);

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

testStorageAccess();
