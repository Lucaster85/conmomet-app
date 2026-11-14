## ¿Qué es el módulo Postulantes?

Es el registro de las **personas que se presentan a trabajar** y todavía no son empleados. Se ubica en
**Personal → Postulantes**. Sirve para que una persona que se acercó a la oficina o a la planta con su
currículum **no se pierda en un papel o en el WhatsApp de alguien**: queda cargada con sus datos, sus
papeles y el seguimiento de cómo va su postulación.

Hoy se carga **a mano** desde acá. Más adelante, el formulario "Trabajá con nosotros" de la página web va a
cargar a los postulantes solo, en este mismo módulo.

## Persona y postulación: dos cosas distintas

- El **postulante** es la **persona**: nombre, DNI, contacto, oficio, papeles. Se carga **una sola vez**.
- La **postulación** es **cada vez que esa persona se presenta**. Tiene su propia **etapa** y su historial.

Por eso, si alguien que ya estuvo cargado vuelve a presentarse meses después, **no se lo carga de nuevo**:
se entra a su ficha y se crea una **nueva postulación**.

## Cargar un postulante

Con el botón **"Nuevo postulante"** (solo para quien tiene permiso para crear):

- **Nombre y apellido** son lo único obligatorio. Alguien que llega a la oficina puede no tener el DNI a mano:
  el resto se completa después desde su ficha.
- **DNI y CUIL**, **teléfono** y **email**, **fecha de nacimiento**, **localidad** y **dirección**.
- **Oficio o puesto de interés**, **categoría** (la del convenio, si ya se sabe), **años de experiencia** y si
  tiene **registro de conducir**.
- **Cómo llegó**: *Presencial*, *Recomendado* u *Otro*. "Web" no se elige a mano: lo pone solo el formulario público.
- **Notas** internas: solo las ve el equipo.
- **Puesto al que se postula** y **carta o comentario**: son de la postulación. Si no se indica el puesto, se usa el oficio.
- **Papeles**: se pueden adjuntar hasta **5 archivos** (PDF, Word, JPG o PNG, **hasta 10 MB cada uno**), y a cada
  uno se le indica el **tipo**: CV, carta de presentación, certificado u otro.

Al guardar se crea el postulante, su primera postulación en etapa **Nueva** y se guardan los papeles. Es todo o
nada: si algo falla, no queda nada cargado a medias.

## Aviso de duplicados

Mientras se escribe el DNI, el CUIL, el email o el teléfono, el sistema **avisa en vivo** si:

- **Ya hay otro postulante** con esos datos (**posible duplicado**): se muestra con un enlace para abrir su ficha.
  El teléfono se compara aunque esté escrito distinto (con o sin 0, con o sin 15, con o sin +54 9).
- **El DNI o CUIL ya es de un empleado actual**.
- **El DNI o CUIL es de un ex-empleado**: se avisa con la fecha de egreso.

Los avisos **no bloquean**: se puede seguir cargando. Lo que sí rechaza el sistema es un **DNI o CUIL que ya tiene
otro postulante**: en ese caso hay que abrir al que ya existe.

### Ex-empleados

Una persona que ya trabajó en la empresa **se puede cargar como postulante**, pero se muestra un aviso
destacado en su ficha. **No se la va a poder dar de alta como empleado desde este módulo**: el reingreso se
trata aparte. (La conversión de postulante en empleado todavía no está disponible.)

## La ficha del postulante

Al tocar un postulante se abre su ficha, con:

- **Datos**, con acceso rápido a **WhatsApp** si tiene teléfono. **Editar datos** corrige cualquier campo.
- **Postulaciones**, con la etapa de cada una y los botones para moverla.
- **Papeles**: se abren con un clic en el nombre del archivo. Se pueden **agregar** más o **eliminar** uno.
- **Historial**: qué cambió, quién lo hizo y cuándo.

## Etapas de una postulación

| Etapa | Qué significa |
|---|---|
| **Nueva** | Recién cargada, nadie la miró. |
| **En revisión** | Se está revisando el perfil. |
| **Entrevista** | Pasó a entrevista. |
| **Oferta** | Se le hizo una oferta. |
| **Rechazada** | No sigue. Hay que indicar el **motivo**. |
| **Retirada** | La persona dejó de estar interesada. |
| **Contratada** | Se la dio de alta como empleado (todavía no disponible). |

No se puede saltar cualquier etapa: desde **Nueva** se pasa a *En revisión*, *Entrevista*, *Rechazada* o
*Retirada*; desde **En revisión** a *Entrevista*, *Oferta*, *Rechazada* o *Retirada*; desde **Entrevista** a
*Oferta*, *Rechazada* o *Retirada*; y desde **Oferta** a *Rechazada* o *Retirada*. Los botones de la ficha solo
muestran los pasos permitidos. Cada cambio permite dejar un **comentario** que queda en el historial.

**Reabrir:** una postulación *Rechazada* o *Retirada* se puede **reabrir**, y vuelve a *En revisión* (no a la
etapa en la que estaba: retomarla es una decisión nueva). Un postulante solo puede tener **una postulación
abierta** a la vez, así que no se puede reabrir una si ya hay otra en curso.

## Qué se ve en el listado

Por defecto el listado **oculta a los postulantes que ya terminaron** (todas sus postulaciones rechazadas,
retiradas o contratadas) para que se vea lo que está en curso. Para verlos, activá **"Ver terminados"**. Elegir
una **etapa** en el filtro muestra a quienes tienen una postulación en esa etapa, aunque estén terminados.
También se puede filtrar por **origen** y buscar por nombre, DNI, CUIL, email, teléfono u oficio.

## Eliminar un postulante

El botón **Eliminar** (solo con ese permiso) **borra de forma definitiva** al postulante: sus datos, sus
postulaciones, el historial y **todos sus archivos**. No se puede deshacer. Está pensado para cuando una persona
pide que se borren sus datos. Si una postulación simplemente no avanzó, no se elimina: se **rechaza** o se marca
como **retirada**.

## Privacidad

Los currículums son datos personales: **los archivos son privados** (se abren con un enlace temporal, igual que
el resto de los documentos del sistema) y **solo los ve quien tiene acceso a Postulantes**. No aparecen en
Documentación ni en los avisos de vencimientos.

## Permisos

- **Postulantes — ver**: entrar al módulo y abrir fichas.
- **Postulantes — crear**: cargar postulantes, crear postulaciones y agregar archivos.
- **Postulantes — modificar**: editar datos y cambiar de etapa.
- **Postulantes — eliminar**: borrar postulantes y archivos.

<!-- ref: conmomet-app/src/app/dashboard/candidates/page.tsx, conmomet-app/src/app/dashboard/candidates/[id]/page.tsx, conmomet-app/src/components/candidates/CandidateFormFields.tsx, conmomet-app/src/components/candidates/CandidateDuplicateAlerts.tsx, conmomet-app/src/components/candidates/CandidateFilePicker.tsx, conmomet-app/src/utils/candidates.ts, api_conmomet/controllers/candidateController.js, api_conmomet/helpers/candidateStages.js, api_conmomet/helpers/candidateMatching.js, api_conmomet/helpers/phone.js, api_conmomet/middlewares/candidateUpload.js, api_conmomet/models/candidate.js -->
