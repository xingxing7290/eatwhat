<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, Delete, Upload } from '@element-plus/icons-vue';
import { useMealStore } from '../stores/meal';

const route = useRoute();
const router = useRouter();
const mealStore = useMealStore();
const formRef = ref(null);
const loading = ref(false);
const submitting = ref(false);
const imageFile = ref(null);
const imagePreview = ref('');
const photoFiles = ref([]);
const stepImageInputs = ref({});
const editMode = computed(() => !!route.params.id);
const pageTitle = computed(() => editMode.value ? '编辑菜品' : '创建菜品');

const form = reactive({
  name: '', description: '', category: '', subcategory: '', tags: [], imageUrl: '', existingPhotos: [],
  ingredients: [], steps: [], tips: '', servingSize: '', prepTime: 0, cookTime: 0,
  difficulty: '', taste: [], healthTags: [], spiceLevel: 0, source: '', sourcePath: '', favorite: false, rating: 0
});
const newIngredient = reactive({ name: '', amount: '' });
const newStep = reactive({ description: '', imageFile: null, imagePreview: '' });
const rules = { name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }] };

const totalTime = computed(() => Number(form.prepTime || 0) + Number(form.cookTime || 0));
const difficultyOptions = [{ label: '简单', value: 'easy' }, { label: '适中', value: 'medium' }, { label: '费工夫', value: 'hard' }];
const tasteOptions = ['酸甜', '清淡', '下饭', '鲜香', '浓郁', '辣', '不辣', '甜品', '汤羹', '早餐'];
const healthTagOptions = ['清淡', '高蛋白', '快手', '少油', '下饭', '重口', '蔬菜多'];

const addIngredient = () => {
  if (!newIngredient.name.trim()) return ElMessage.warning('请输入食材名称');
  form.ingredients.push({ name: newIngredient.name.trim(), amount: newIngredient.amount.trim() });
  newIngredient.name = ''; newIngredient.amount = '';
};
const removeIngredient = (index) => form.ingredients.splice(index, 1);
const addStep = () => {
  if (!newStep.description.trim()) return ElMessage.warning('请输入做法步骤');
  form.steps.push({ description: newStep.description.trim(), imageUrl: newStep.imagePreview || '', imageFile: newStep.imageFile || null });
  newStep.description = ''; newStep.imageFile = null; newStep.imagePreview = '';
};
const removeStep = (index) => form.steps.splice(index, 1);
const moveStep = (index, delta) => {
  const target = index + delta;
  if (target < 0 || target >= form.steps.length) return;
  const [item] = form.steps.splice(index, 1);
  form.steps.splice(target, 0, item);
};
const onCoverChange = (file) => { imageFile.value = file; imagePreview.value = URL.createObjectURL(file.raw); };
const onPhotosChange = (file, files) => { photoFiles.value = files; };
const onNewStepImage = (file) => { newStep.imageFile = file; newStep.imagePreview = URL.createObjectURL(file.raw); };
const onStepImage = (index, file) => { form.steps[index].imageFile = file; form.steps[index].imageUrl = URL.createObjectURL(file.raw); };
const removeExistingPhoto = (photo) => { form.existingPhotos = form.existingPhotos.filter(item => item !== photo); };

const fillForm = (meal) => {
  Object.assign(form, {
    name: meal.name || '', description: meal.description || '', category: meal.category || '', subcategory: meal.subcategory || '',
    tags: [...(meal.tags || [])], imageUrl: meal.imageUrl || '', existingPhotos: [...(meal.photos || [])],
    ingredients: (meal.ingredients || []).map(i => ({ name: i.name || i, amount: i.amount || '' })),
    steps: (meal.steps || []).map(s => typeof s === 'string' ? { description: s, imageUrl: '' } : { description: s.description || '', imageUrl: s.imageUrl || '' }),
    tips: meal.tips || '', servingSize: meal.servingSize || '', prepTime: meal.prepTime || 0, cookTime: meal.cookTime || 0,
    difficulty: meal.difficulty || '', taste: [...(meal.taste || [])], healthTags: [...(meal.healthTags || [])], spiceLevel: meal.spiceLevel || 0, source: meal.source || '', sourcePath: meal.sourcePath || '', favorite: !!meal.favorite, rating: meal.rating || 0
  });
  imagePreview.value = meal.imageUrl || '';
};
const load = async () => {
  if (!editMode.value) return;
  loading.value = true;
  try { fillForm(await mealStore.fetchMeal(route.params.id)); }
  catch (e) { ElMessage.error('加载菜品失败'); router.push('/meals'); }
  finally { loading.value = false; }
};
const buildPayload = () => {
  const fd = new FormData();
  ['name','description','category','subcategory','tips','servingSize','prepTime','cookTime','difficulty','spiceLevel','source','sourcePath','favorite','rating','imageUrl'].forEach(key => fd.append(key, form[key] ?? ''));
  fd.append('tags', JSON.stringify(form.tags));
  fd.append('taste', JSON.stringify(form.taste));
  fd.append('healthTags', JSON.stringify(form.healthTags));
  fd.append('ingredients', JSON.stringify(form.ingredients));
  fd.append('existingPhotos', JSON.stringify(form.existingPhotos));
  const stepPayload = form.steps.map(s => ({ description: s.description, imageUrl: s.imageFile ? '' : (s.imageUrl || '') }));
  const stepImageIndexes = [];
  form.steps.forEach((step, index) => { if (step.imageFile?.raw) { fd.append('stepImages', step.imageFile.raw); stepImageIndexes.push(index); } });
  fd.append('steps', JSON.stringify(stepPayload));
  fd.append('stepImageIndexes', JSON.stringify(stepImageIndexes));
  if (imageFile.value?.raw) fd.append('image', imageFile.value.raw);
  photoFiles.value.forEach(file => { if (file.raw) fd.append('photos', file.raw); });
  return fd;
};
const submit = async () => {
  await formRef.value?.validate(async valid => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (editMode.value) await mealStore.updateMeal(route.params.id, buildPayload());
      else await mealStore.createMeal(buildPayload());
      ElMessage.success('菜品已保存');
      router.push('/meals');
    } catch (e) { ElMessage.error(e?.error || '保存失败'); }
    finally { submitting.value = false; }
  });
};
onMounted(load);
</script>

<template>
  <div class="meal-editor" v-loading="loading">
    <div class="page-header"><h1>{{ pageTitle }}</h1><div><el-button @click="router.push('/meals')">取消</el-button><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></div></div>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="editor-grid">
      <section class="main-column">
        <el-card><template #header>基础信息</template>
          <div class="two-cols"><el-form-item label="菜品名称" prop="name"><el-input v-model="form.name" /></el-form-item><el-form-item label="分类"><el-input v-model="form.category" placeholder="家常菜、外食、甜品..." /></el-form-item></div>
          <div class="two-cols"><el-form-item label="子类"><el-input v-model="form.subcategory" placeholder="热菜、汤、早餐..." /></el-form-item><el-form-item label="份量"><el-input v-model="form.servingSize" placeholder="2人份" /></el-form-item></div>
          <el-form-item label="简介"><el-input v-model="form.description" type="textarea" rows="3" /></el-form-item>
          <div class="two-cols"><el-form-item label="准备时间(分钟)"><el-input-number v-model="form.prepTime" :min="0" /></el-form-item><el-form-item label="烹饪时间(分钟)"><el-input-number v-model="form.cookTime" :min="0" /></el-form-item></div>
          <div class="two-cols"><el-form-item label="难度"><el-select v-model="form.difficulty" clearable><el-option v-for="opt in difficultyOptions" :key="opt.value" :label="opt.label" :value="opt.value" /></el-select></el-form-item><el-form-item label="总耗时"><el-tag>{{ totalTime }} 分钟</el-tag></el-form-item></div>
          <el-form-item label="标签"><el-select v-model="form.tags" multiple filterable allow-create default-first-option style="width:100%;" /></el-form-item>
          <el-form-item label="口味偏好"><el-select v-model="form.taste" multiple filterable allow-create style="width:100%;"><el-option v-for="item in tasteOptions" :key="item" :label="item" :value="item" /></el-select></el-form-item>
          <el-form-item label="健康/均衡标签"><el-select v-model="form.healthTags" multiple filterable allow-create style="width:100%;"><el-option v-for="item in healthTagOptions" :key="item" :label="item" :value="item" /></el-select></el-form-item>
          <div class="two-cols"><el-form-item label="辣度"><el-rate v-model="form.spiceLevel" :max="5" /></el-form-item><el-form-item label="评分"><el-rate v-model="form.rating" :max="5" /></el-form-item></div>
          <el-checkbox v-model="form.favorite">收藏到常做菜</el-checkbox>
        </el-card>

        <el-card><template #header>食材</template>
          <div class="inline-form"><el-input v-model="newIngredient.name" placeholder="食材" /><el-input v-model="newIngredient.amount" placeholder="用量" /><el-button type="primary" @click="addIngredient"><el-icon><Plus /></el-icon></el-button></div>
          <el-table v-if="form.ingredients.length" :data="form.ingredients"><el-table-column prop="name" label="食材" /><el-table-column prop="amount" label="用量" /><el-table-column width="80"><template #default="scope"><el-button type="danger" circle size="small" @click="removeIngredient(scope.$index)"><el-icon><Delete /></el-icon></el-button></template></el-table-column></el-table>
          <el-empty v-else description="暂无食材" />
        </el-card>

        <el-card><template #header>做法步骤</template>
          <div class="step-editor"><el-input v-model="newStep.description" type="textarea" rows="2" placeholder="写下一个步骤" /><el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="onNewStepImage"><el-button><el-icon><Upload /></el-icon>步骤图</el-button></el-upload><img v-if="newStep.imagePreview" :src="newStep.imagePreview" /><el-button type="primary" @click="addStep">添加步骤</el-button></div>
          <div v-if="form.steps.length" class="steps"><div v-for="(step, index) in form.steps" :key="index" class="step-item"><div class="step-no">{{ index + 1 }}</div><img v-if="step.imageUrl" :src="step.imageUrl" /><el-input v-model="step.description" type="textarea" rows="2" /><div class="step-actions"><el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="file => onStepImage(index, file)"><el-button size="small">换图</el-button></el-upload><el-button size="small" :disabled="index===0" @click="moveStep(index,-1)">上移</el-button><el-button size="small" :disabled="index===form.steps.length-1" @click="moveStep(index,1)">下移</el-button><el-button size="small" type="danger" @click="removeStep(index)">删除</el-button></div></div></div>
          <el-empty v-else description="暂无做法步骤" />
        </el-card>

        <el-card><template #header>烹饪技巧和来源</template><el-form-item label="小贴士"><el-input v-model="form.tips" type="textarea" rows="3" /></el-form-item><div class="two-cols"><el-form-item label="来源"><el-input v-model="form.source" /></el-form-item><el-form-item label="来源链接/位置"><el-input v-model="form.sourcePath" /></el-form-item></div></el-card>
      </section>

      <aside class="side-column">
        <el-card><template #header>封面照片</template><el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="onCoverChange"><div class="cover-box"><img v-if="imagePreview" :src="imagePreview" /><div v-else><el-icon><Upload /></el-icon><p>上传封面</p></div></div></el-upload></el-card>
        <el-card><template #header>照片墙</template><div v-if="form.existingPhotos.length" class="photo-grid"><div v-for="photo in form.existingPhotos" :key="photo" class="photo-item"><img :src="photo" /><el-button size="small" type="danger" @click="removeExistingPhoto(photo)">移除</el-button></div></div><el-upload action="#" :auto-upload="false" multiple list-type="picture-card" v-model:file-list="photoFiles" :on-change="onPhotosChange"><el-icon><Plus /></el-icon></el-upload></el-card>
      </aside>
    </el-form>
  </div>
</template>

<style scoped>
.meal-editor { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: var(--bg-primary); border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px var(--shadow-color); }
h1 { margin: 0; color: var(--text-primary); }
.editor-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.main-column, .side-column { display: flex; flex-direction: column; gap: 18px; }
.two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.inline-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; margin-bottom: 12px; }
.cover-box { height: 260px; border: 1px dashed var(--border-color); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); overflow: hidden; background: var(--bg-secondary); cursor: pointer; }
.cover-box img { width: 100%; height: 100%; object-fit: cover; }
.step-editor { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: start; margin-bottom: 14px; }
.step-editor img { width: 90px; height: 64px; object-fit: cover; border-radius: 8px; }
.steps { display: flex; flex-direction: column; gap: 12px; }
.step-item { display: grid; grid-template-columns: 34px 100px 1fr auto; gap: 10px; align-items: start; background: var(--bg-secondary); padding: 12px; border-radius: 10px; }
.step-no { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.step-item img { width: 100px; height: 72px; object-fit: cover; border-radius: 8px; }
.step-actions { display: flex; flex-direction: column; gap: 6px; }
.photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px; }
.photo-item { position: relative; }
.photo-item img { width: 100%; height: 100px; object-fit: cover; border-radius: 8px; }
.photo-item .el-button { margin-top: 4px; width: 100%; }
@media (max-width: 980px) { .editor-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .page-header, .two-cols, .inline-form, .step-editor, .step-item { grid-template-columns: 1fr; } .step-actions { flex-direction: row; flex-wrap: wrap; } }
</style>