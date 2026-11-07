export const allergens=[['milk','Lácteos','Milk','Milch'],['gluten','Con gluten','With gluten','Mit Gluten'],['fish','Pescado','Fish','Fisch'],['molluscs','Moluscos','Molluscs','Weichtiere'],['crustaceans','Crustáceos','Crustaceans','Krebstiere'],['sesame','Sésamo','Sesame','Sesam'],['peanuts','Cacahuetes','Peanuts','Erdnüsse'],['eggs','Huevos','Eggs','Eier'],['sulphites','Sulfitos','Sulphites','Sulfite'],['mustard','Mostaza','Mustard','Senf'],['soya','Con soja','With soya','Mit Soja'],['lupins','Altramuces','Lupins','Lupinen'],['celery','Apio','Celery','Sellerie'],['nuts','Frutos secos','Nuts','Schalenfrüchte']];
const fields={restaurant:['name','tagline','logo','demo'],category:['id','name','en','de'],dish:['id','categoryId','name','description','price','hidden','imageSrc','allergens','translations']};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const text=(v,n,required=false)=>typeof v==='string'&&v.length<=n&&(!required||v.trim().length>0);
const image=v=>typeof v==='string'&&(!v||/^\/media\/[a-f0-9]{64}\.(webp|jpg|png)$/.test(v));
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
export function localize(d,lang){return {...d,name:d.translations?.[lang]?.name||d.name,description:d.translations?.[lang]?.description||d.description};}
export function validate(data){
 const fail=()=>{throw new Error('Datos inválidos: revisa nombres, precios, imágenes y secciones.');};
 const keys=(v,kind)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>fields[kind].includes(k));
 const r=data?.restaurant;if(!keys(r,'restaurant')||!text(r.name,100,true)||!text(r.tagline,160)||!image(r.logo)||typeof r.demo!=='boolean')fail();
 if(!Array.isArray(data.categories)||!data.categories.length||data.categories.length>30||new Set(data.categories.map(c=>c.id)).size!==data.categories.length)fail();
 for(const c of data.categories)if(!keys(c,'category')||!id(c.id)||!text(c.name,80,true)||!text(c.en,80)||!text(c.de,80))fail();
 if(!Array.isArray(data.dishes)||data.dishes.length>500||new Set(data.dishes.map(d=>d.id)).size!==data.dishes.length)fail();
 for(const d of data.dishes){
  if(!keys(d,'dish')||!id(d.id)||!data.categories.some(c=>c.id===d.categoryId)||!text(d.name,160,true)||!text(d.description,2000)||typeof d.price!=='number'||!Number.isFinite(d.price)||d.price<0||d.price>99999.99||typeof d.hidden!=='boolean'||!image(d.imageSrc)||!Array.isArray(d.allergens)||new Set(d.allergens).size!==d.allergens.length||d.allergens.some(a=>!allergens.some(row=>row[0]===a)))fail();
  if(!d.translations||typeof d.translations!=='object'||Array.isArray(d.translations)||Object.keys(d.translations).some(l=>!['en','de'].includes(l)))fail();
  for(const t of Object.values(d.translations))if(!t||Object.keys(t).some(k=>!['name','description'].includes(k))||!text(t.name,160)||!text(t.description,2000))fail();
 }
 if(new TextEncoder().encode(JSON.stringify(data)).length>1300000)fail();
 return data;
}
export function diff(base,next){
 const changes=[];
 for(const [entity,b,a] of [['restaurant',[{...base.restaurant,id:'restaurant'}],[{...next.restaurant,id:'restaurant'}]],['category',base.categories,next.categories],['dish',base.dishes,next.dishes]]){
  for(const item of a){const old=b.find(x=>x.id===item.id);if(!old){changes.push({entity,id:item.id,before:null,after:item});continue;}
   const before={},after={};for(const key of fields[entity])if(key!=='id'&&!same(old[key],item[key])){before[key]=old[key];after[key]=item[key];}
   if(Object.keys(after).length)changes.push({entity,id:item.id,before,after});
  }
  for(const old of b)if(!a.some(x=>x.id===old.id))changes.push({entity,id:old.id,before:old,after:null});
 }
 return changes;
}
export function mergeChanges(current,changes){
 if(!Array.isArray(changes)||changes.length>600)throw new Error('Cambios inválidos');
 const next=structuredClone(current);const seen=new Set();
 const conflict=()=>{const e=new Error('Conflicto: otro dispositivo ha cambiado el mismo dato. Tu edición se conserva.');e.status=409;throw e;};
 for(const change of changes){
  const {entity,id:ident,before,after}=change??{};
  if(!Object.hasOwn(fields,entity)||!id(ident)||seen.has(`${entity}:${ident}`))throw new Error('Operación inválida');seen.add(`${entity}:${ident}`);
  const list=entity==='dish'?next.dishes:entity==='category'?next.categories:[next.restaurant];
  const item=entity==='restaurant'?next.restaurant:list.find(x=>x.id===ident);
  if(entity==='restaurant'&&(ident!=='restaurant'||!before||!after))throw new Error('Identidad inválida');
  for(const obj of [before,after])if(obj!==null&&(!obj||typeof obj!=='object'||Array.isArray(obj)||Object.keys(obj).some(k=>!fields[entity].includes(k))))throw new Error('Campos inválidos');
  if(before===null){if(item)conflict();if(!after||after.id!==ident)throw new Error('Alta inválida');list.push(structuredClone(after));continue;}
  if(!item)conflict();
  if(after===null){if(!same(item,before))conflict();list.splice(list.indexOf(item),1);continue;}
  if(Object.hasOwn(after,'id')||!same(Object.keys(before).sort(),Object.keys(after).sort()))throw new Error('Campos de edición inválidos');
  for(const k of Object.keys(after))if(!same(item[k],before[k])&&!same(item[k],after[k]))conflict();
  Object.assign(item,structuredClone(after));
 }
 return validate(next);
}
export function seed(){
 const categories=[['entrantes','Entrantes','Starters','Vorspeisen'],['ensaladas','Ensaladas','Salads','Salate'],['principales','Principales','Main courses','Hauptgerichte'],['postres','Postres','Desserts','Desserts']].map(([id,name,en,de])=>({id,name,en,de}));
 const names=[['Croquetas de la casa','Verduras de temporada','Crema del día','Tosta del chef'],['Ensalada de la huerta','Ensalada templada','Ensalada de temporada','Ensalada de la casa'],['Arroz de temporada','Pasta de la casa','Pescado del día','Especial del chef'],['Tarta de la casa','Fruta de temporada','Postre del día','Selección dulce']];
 const en=[['House croquettes','Seasonal vegetables','Soup of the day','Chef’s toast'],['Garden salad','Warm salad','Seasonal salad','House salad'],['Seasonal rice','House pasta','Fish of the day','Chef’s special'],['House cake','Seasonal fruit','Dessert of the day','Sweet selection']];
 const de=[['Hauskroketten','Saisongemüse','Tagessuppe','Toast des Küchenchefs'],['Gartensalat','Warmer Salat','Saisonsalat','Haussalat'],['Saisonreis','Hauspasta','Fisch des Tages','Empfehlung des Küchenchefs'],['Hauskuchen','Saisonobst','Tagesdessert','Süße Auswahl']];
 const dishes=categories.flatMap((c,i)=>names[i].map((name,j)=>({id:`ejemplo-${c.id}-${j+1}`,categoryId:c.id,name,description:'Plato de ejemplo. Sustituye este texto por la descripción de tu restaurante.',price:[6.5,8,14,5][i]+j,hidden:false,imageSrc:'',allergens:[],translations:{en:{name:en[i][j],description:'Sample dish. Replace with your restaurant’s description.'},de:{name:de[i][j],description:'Beispielgericht. Ersetzen Sie diesen Text durch Ihre Beschreibung.'}}})));
 return {restaurant:{name:'Tu restaurante',tagline:'COCINA CON PERSONALIDAD',logo:'',demo:true},categories,dishes};
}
