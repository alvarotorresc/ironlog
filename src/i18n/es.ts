import type { TranslationKey } from './en';

export const es: Record<TranslationKey, string> = {
  // Common
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.close': 'Cerrar',
  'common.back': 'Volver',
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.or': 'O',
  'common.noData': 'Sin datos',
  'common.kg': 'kg',
  'common.cm': 'cm',
  'common.lbs': 'lbs',
  'common.in': 'in',

  // Tabs
  'tabs.home': 'Inicio',
  'tabs.exercises': 'Ejercicios',
  'tabs.routines': 'Rutinas',
  'tabs.history': 'Historial',
  'tabs.body': 'Cuerpo',

  // Home
  'home.title': 'IronLog',
  'home.startWorkout': 'Iniciar Entrenamiento',
  'home.readyTitle': '\u00BFListo para empezar?',
  'home.readyMessage':
    'Pulsa Iniciar Entrenamiento para registrar tu primera sesi\u00F3n. Tus estad\u00EDsticas, PRs y progreso aparecer\u00E1n aqu\u00ED.',
  'home.thisWeek': 'Esta Semana',
  'home.streak': 'Racha',
  'home.totalLifted': 'Total Levantado',
  'home.thisMonth': 'Este Mes',
  'home.recentPRs': 'PRs Recientes',
  'home.noPRs': 'Sin PRs recientes. \u00A1Sigue empujando!',
  'home.muscleDistribution': 'Distribuci\u00F3n Muscular',
  'home.muscleFatigue': 'Fatiga Muscular',
  'home.footer': 'Hecho con {emoji} por Alvaro Torres',

  // Home — Select Routine Modal
  'home.selectRoutine': 'Seleccionar Rutina',
  'home.emptyWorkout': 'Entrenamiento Libre',
  'home.emptyWorkoutDesc': 'Empieza sin rutina, a\u00F1ade ejercicios sobre la marcha',
  'home.noRoutines': 'A\u00FAn no hay rutinas',
  'home.noRoutinesDesc':
    'Crea una en la pesta\u00F1a Rutinas, o inicia un entrenamiento libre arriba.',
  'home.exerciseCount': '{count} ejercicio',
  'home.exerciseCountPlural': '{count} ejercicios',
  'home.moreExercises': '+{count} m\u00E1s',

  // Exercises
  'exercises.title': 'Ejercicios',
  'exercises.createNew': 'Crear nuevo ejercicio',
  'exercises.count': '{count} ejercicio',
  'exercises.countPlural': '{count} ejercicios',
  'exercises.empty': 'A\u00FAn no hay ejercicios. Crea tu primer ejercicio para empezar.',
  'exercises.createExercise': 'Crear Ejercicio',
  'exercises.filterAll': 'Todos',

  // Exercise Detail
  'exercise.stats': 'Estad\u00EDsticas',
  'exercise.currentPR': 'PR Actual',
  'exercise.lastWorkout': '\u00DAltimo Entrenamiento',
  'exercise.totalSessions': 'Sesiones Totales',
  'exercise.avgVolume': 'Volumen Medio',
  'exercise.progress': 'Progreso',
  'exercise.maxWeight': 'Peso M\u00E1ximo',
  'exercise.volume': 'Volumen',
  'exercise.noProgress': 'Completa un entrenamiento con este ejercicio para ver tu progreso.',
  'exercise.deleteTitle': 'Eliminar Ejercicio',
  'exercise.deleteMessage':
    '\u00BFEst\u00E1s seguro? Esto tambi\u00E9n lo eliminar\u00E1 de todas las rutinas.',

  // Exercise Create
  'exercise.create.title': 'Crear Ejercicio',
  'exercise.create.name': 'Nombre',
  'exercise.create.namePlaceholder': 'ej. Press de Banca',
  'exercise.create.type': 'Tipo',
  'exercise.create.muscleGroup': 'Grupo Muscular',
  'exercise.create.muscleGroups': 'Grupos Musculares',
  'exercise.create.muscleGroupsPlaceholder': 'Selecciona grupos musculares...',
  'exercise.create.restTime': 'Descanso por defecto (segundos)',
  'exercise.create.restPlaceholder': 'ej. 90',

  // Exercise Edit
  'exercise.edit.title': 'Editar Ejercicio',
  'exercise.edit.saveError': 'Error al actualizar el ejercicio',
  'exercise.edit.notFound': 'Ejercicio no encontrado',

  // Routines
  'routines.title': 'Rutinas',
  'routines.createNew': 'Crear nueva rutina',
  'routines.empty':
    'A\u00FAn no hay rutinas. Crea tu primera rutina para organizar tus entrenamientos.',
  'routines.createRoutine': 'Crear Rutina',
  'routines.templates': 'Plantillas',
  'routines.useTemplate': 'Usar Plantilla',
  'routines.templateCloned': 'Plantilla a\u00F1adida a tus rutinas',
  'routines.myRoutines': 'Mis Rutinas',
  'routines.templateExercises': '{count} ejercicios',

  // Template names
  'template.pushDay': 'D\u00EDa de Empuje',
  'template.pullDay': 'D\u00EDa de Jal\u00F3n',
  'template.legDay': 'D\u00EDa de Piernas',
  'template.upperBody': 'Tren Superior',
  'template.lowerBody': 'Tren Inferior',
  'template.fullBody': 'Cuerpo Completo',

  // Routine Detail
  'routine.exercises': 'Ejercicios',
  'routine.noExercises': 'No hay ejercicios en esta rutina.',
  'routine.startWorkout': 'Iniciar Entrenamiento',
  'routine.deleteTitle': 'Eliminar Rutina',
  'routine.deleteMessage': '\u00BFEst\u00E1s seguro de que quieres eliminar esta rutina?',

  // Routine Create
  'routine.create.title': 'Crear Rutina',
  'routine.create.name': 'Nombre de la Rutina',
  'routine.create.namePlaceholder': 'ej. D\u00EDa de Push',
  'routine.create.addExercise': 'A\u00F1adir Ejercicio',
  'routine.create.noExercises': 'A\u00F1ade al menos un ejercicio a tu rutina.',
  'routine.create.save': 'Crear Rutina',

  // History
  'history.title': 'Historial',
  'history.empty':
    'A\u00FAn no hay entrenamientos. Completa tu primer entrenamiento para verlo aqu\u00ED.',
  'history.duration': '{hours}h {minutes}m',
  'history.durationMinutes': '{minutes}m',
  'history.deleteTitle': 'Eliminar Entrenamiento',
  'history.deleteMessage':
    '\u00BFEst\u00E1s seguro de que quieres eliminar este registro de entrenamiento?',

  // Workout
  'workout.title': 'Entrenamiento',
  'workout.emptyTitle': 'Entrenamiento Libre',
  'workout.finish': 'Terminar Entrenamiento',
  'workout.finishTitle': '\u00BFTerminar Entrenamiento?',
  'workout.finishMessage': '\u00BFGuardar esta sesi\u00F3n de entrenamiento?',
  'workout.finishConfirm': 'Terminar',
  'workout.discardTitle': '\u00BFDescartar Entrenamiento?',
  'workout.discardMessage': 'Se perder\u00E1 tu progreso.',
  'workout.discard': 'Descartar',
  'workout.addExercise': 'A\u00F1adir Ejercicio',
  'workout.addSet': 'A\u00F1adir Serie',
  'workout.moveUp': 'Mover arriba',
  'workout.moveDown': 'Mover abajo',
  'workout.set': 'Serie {number}',
  'workout.weight': 'Peso',
  'workout.reps': 'Reps',
  'workout.rest': 'Descanso',
  'workout.notes': 'Notas',
  'workout.notesPlaceholder': 'Añadir nota...',

  // Workout Detail
  'workoutDetail.title': 'Detalle del Entrenamiento',
  'workoutDetail.duration': 'Duraci\u00F3n',
  'workoutDetail.totalVolume': 'Volumen Total',
  'workoutDetail.sets': 'Series',
  'workoutDetail.exercises': 'Ejercicios',

  // Body
  'body.title': 'Cuerpo',
  'body.addMeasurement': 'A\u00F1adir Medici\u00F3n',
  'body.empty':
    'A\u00FAn no hay mediciones. Registra tu peso y medidas corporales a lo largo del tiempo.',
  'body.deleteTitle': 'Eliminar Medici\u00F3n',
  'body.deleteMessage': '\u00BFEst\u00E1s seguro de que quieres eliminar esta entrada?',
  'body.same': 'Igual',
  'body.bodyFat': 'Grasa Corporal',
  'body.chest': 'Pecho',
  'body.waist': 'Cintura',
  'body.hips': 'Cadera',
  'body.biceps': 'B\u00EDceps',
  'body.thighs': 'Muslos',

  // Body Add
  'body.add.title': 'A\u00F1adir Medici\u00F3n',
  'body.add.weight': 'Peso',
  'body.add.weightPlaceholder': 'ej. 80.5',
  'body.add.bodyFat': 'Grasa Corporal (%)',
  'body.add.bodyFatPlaceholder': 'ej. 15',
  'body.add.measurements': 'Medidas',
  'body.add.notes': 'Notas',
  'body.add.notesPlaceholder': 'ej. Ma\u00F1ana, en ayunas',
  'body.add.validWeight': 'Introduce un peso v\u00E1lido',
  'body.add.validBodyFat': 'Introduce un valor entre 0-100',
  'body.add.validMeasurement': 'Introduce una medida v\u00E1lida',
  'body.add.atLeastOne': 'Introduce al menos una medida',
  'body.add.saveError': 'Error al guardar la medici\u00F3n',

  // Body Edit
  'body.edit.title': 'Editar Medici\u00F3n',
  'body.edit.saveError': 'Error al actualizar la medici\u00F3n',
  'body.edit.notFound': 'Medici\u00F3n no encontrada',

  // Exercise Picker Modal
  'exercisePicker.title': 'A\u00F1adir Ejercicio',
  'exercisePicker.search': 'Buscar ejercicios...',
  'exercisePicker.filterAll': 'Todos',

  // Muscle groups
  'muscle.chest': 'Pecho',
  'muscle.back': 'Espalda',
  'muscle.legs': 'Piernas',
  'muscle.shoulders': 'Hombros',
  'muscle.arms': 'Brazos',
  'muscle.core': 'Core',
  'muscle.full_body': 'Cuerpo Completo',
  'muscle.more': '+{count} más',

  // Exercise types
  'type.weights': 'Pesas',
  'type.calisthenics': 'Calistenia',
  'type.cardio': 'Cardio',
  'type.hiit': 'HIIT',
  'type.flexibility': 'Flexibilidad',

  // Rest Timer
  'restTimer.title': 'Temporizador de Descanso',
  'restTimer.skip': 'Saltar',
  'restTimer.addTime': '+30s',

  // Muscle Fatigue
  'fatigue.weakened': 'Debilitado',
  'fatigue.recovering': 'Recuperando',
  'fatigue.recovered': 'Recuperado',
  'fatigue.rested': 'Descansado',

  // Period selector
  'period.1w': '1S',
  'period.1m': '1M',
  'period.3m': '3M',
  'period.6m': '6M',
  'period.all': 'Todo',

  // Empty State
  'emptyState.default': 'Nada aqu\u00ED todav\u00EDa.',

  // Workout — abandon
  'workout.abandonTitle': '\u00BFCancelar entrenamiento?',
  'workout.abandonMessage': 'Se perder\u00E1 tu progreso.',
  'workout.abandon': 'Cancelar entrenamiento',

  // Exercise Detail — rest time
  'exercise.restTime': 'Tiempo de descanso',
  'exercise.restTimeEdit': 'Editar tiempo de descanso',
  'exercise.restTimeSave': 'Guardar',

  // Exercise — notes
  'exercise.notes': 'Notas',
  'exercise.notesPlaceholder': 'Tips de forma, cues, notas personales...',
  'exercise.addNotes': 'A\u00F1adir notas',

  // Body — charts
  'body.chartWeight': 'Peso',
  'body.chartBodyFat': 'Grasa Corporal',
  'body.chartChest': 'Pecho',
  'body.chartWaist': 'Cintura',
  'body.chartHips': 'Cadera',
  'body.chartBiceps': 'B\u00EDceps',
  'body.chartThighs': 'Muslos',
  'body.chartNoData': 'No hay suficientes datos para mostrar la gr\u00E1fica',

  // Body Photos
  'body.photos': 'Fotos',
  'body.addPhoto': 'A\u00F1adir Foto',
  'body.camera': 'C\u00E1mara',
  'body.gallery': 'Galer\u00EDa',
  'body.deletePhoto': '\u00BFEliminar foto?',
  'body.deletePhotoMessage': 'Esta foto se eliminar\u00E1 permanentemente.',
  'body.maxPhotos': 'M\u00E1ximo 4 fotos por entrada',
  'body.photoPermission': 'Se necesita permiso de c\u00E1mara para tomar fotos',
  'body.photoError': 'Error al a\u00F1adir la foto',

  // Backup & Restore
  'backup.title': 'Copia de Seguridad',
  'backup.exportTitle': 'Exportar Datos',
  'backup.exportDesc': 'Guarda todos tus entrenamientos, rutinas y mediciones en un archivo JSON.',
  'backup.exportButton': 'Exportar copia',
  'backup.importTitle': 'Importar Datos',
  'backup.importDesc':
    'Restaura los datos desde una copia exportada anteriormente. Los datos existentes no se eliminar\u00E1n.',
  'backup.importButton': 'Importar copia',
  'backup.exportSuccess': 'Copia exportada correctamente',
  'backup.exportError': 'Error al exportar la copia',
  'backup.importSuccess': 'Datos importados correctamente',
  'backup.importError': 'Error al importar la copia',
  'backup.importInvalidFormat': 'Formato de copia incorrecto',
  'backup.sharingUnavailable': 'El uso compartido no está disponible en este dispositivo',
  'backup.importing': 'Importando...',
  'backup.exporting': 'Exportando...',

  // Exercise Groups
  'group.superset': 'Superserie',
  'group.circuit': 'Circuito',
  'group.dropset': 'Dropset',
  'group.group': 'Agrupar',
  'group.ungroup': 'Desagrupar',
  'group.selectType': 'Seleccionar tipo de grupo',
  'group.label': '{type} {letter}',

  // Settings
  'settings.title': 'Ajustes',
  'settings.units': 'Unidades',
  'settings.metric': 'Métrico (kg, cm)',
  'settings.imperial': 'Imperial (lbs, in)',
  'settings.language': 'Idioma',
  'settings.data': 'Datos',
  'settings.backupRestore': 'Copia de Seguridad',
  'settings.about': 'Acerca de',
  'settings.version': 'Versión',

  // Badges
  'badges.title': 'Logros',
  'badges.unlocked': '{count}/{total} desbloqueados',
  'badges.locked': '???',
  'badges.newBadge': '¡Logro desbloqueado!',
  'badges.congratulations': '¡Felicidades!',
  'badges.continue': 'Continuar',
  'badges.unlockedOn': 'Desbloqueado {date}',

  // Badge: Workout milestones
  'badge.first_workout.title': 'Primeros Pasos',
  'badge.first_workout.desc': 'Completa tu primer entrenamiento',
  'badge.workout_10.title': 'En Serio',
  'badge.workout_10.desc': 'Completa 10 entrenamientos',
  'badge.workout_50.title': 'Dedicado',
  'badge.workout_50.desc': 'Completa 50 entrenamientos',
  'badge.workout_100.title': 'Centurión',
  'badge.workout_100.desc': 'Completa 100 entrenamientos',

  // Badge: Streak
  'badge.streak_3.title': 'En Llamas',
  'badge.streak_3.desc': 'Racha de 3 días de entrenamiento',
  'badge.streak_7.title': 'Imparable',
  'badge.streak_7.desc': 'Racha de 7 días de entrenamiento',
  'badge.streak_30.title': 'Voluntad de Hierro',
  'badge.streak_30.desc': 'Racha de 30 días de entrenamiento',

  // Badge: Volume
  'badge.volume_10000.title': 'Levantador Pesado',
  'badge.volume_10000.desc': 'Levanta 10.000 kg en total',
  'badge.volume_100000.title': 'Mueve Montañas',
  'badge.volume_100000.desc': 'Levanta 100.000 kg en total',
  'badge.volume_1000000.title': 'Leyenda de Hierro',
  'badge.volume_1000000.desc': 'Levanta 1.000.000 kg en total',

  // Badge: Exercise variety
  'badge.exercises_10.title': 'Explorador',
  'badge.exercises_10.desc': 'Usa 10 ejercicios diferentes',
  'badge.exercises_25.title': 'Versátil',
  'badge.exercises_25.desc': 'Usa 25 ejercicios diferentes',

  // Badge: Body tracking
  'badge.first_measurement.title': 'Autoconsciente',
  'badge.first_measurement.desc': 'Registra tu primera medida corporal',
  'badge.measurements_10.title': 'Rastreador de Progreso',
  'badge.measurements_10.desc': 'Registra 10 medidas corporales',

  // Badge: Special
  'badge.early_bird.title': 'Madrugador',
  'badge.early_bird.desc': 'Completa un entrenamiento antes de las 7 AM',

  // Onboarding
  'onboarding.welcome.title': 'Bienvenido a IronLog',
  'onboarding.welcome.subtitle': 'Tu diario de entrenamiento personal',
  'onboarding.routines.title': 'Rutinas',
  'onboarding.routines.bullet1': 'Crea rutinas personalizadas para cada d\u00EDa',
  'onboarding.routines.bullet2': 'Usa plantillas listas (Push, Pull, Piernas...)',
  'onboarding.routines.bullet3': 'Organiza y reordena tus ejercicios',
  'onboarding.sets.title': 'Seguimiento de Series',
  'onboarding.sets.bullet1': 'Registra peso, repeticiones y descanso por serie',
  'onboarding.sets.bullet2': 'Timer de descanso integrado con alertas',
  'onboarding.sets.bullet3': 'Agrupa ejercicios en supersets o circuitos',
  'onboarding.progress.title': 'Progreso y Estad\u00EDsticas',
  'onboarding.progress.bullet1': 'Gr\u00E1ficas de peso, volumen y PRs',
  'onboarding.progress.bullet2': 'Distribuci\u00F3n muscular',
  'onboarding.progress.bullet3': 'Res\u00FAmenes semanales y mensuales',
  'onboarding.badges.title': 'Medallas y Logros',
  'onboarding.badges.bullet1': 'Desbloquea medallas por rachas e hitos',
  'onboarding.badges.bullet2': 'Sigue tu volumen total y variedad de ejercicios',
  'onboarding.badges.bullet3': 'Celebra con animaciones de confeti',
  'onboarding.body.title': 'Medidas Corporales',
  'onboarding.body.bullet1': 'Registra peso, grasa corporal y medidas',
  'onboarding.body.bullet2': 'A\u00F1ade fotos de progreso',
  'onboarding.body.bullet3': 'Ve tu evoluci\u00F3n con gr\u00E1ficas',
  'onboarding.exercises.title': 'Ejercicios Personalizados',
  'onboarding.exercises.bullet1': 'Crea tus propios ejercicios',
  'onboarding.exercises.bullet2': 'A\u00F1ade notas personales y tips de forma',
  'onboarding.exercises.bullet3': 'Filtra por grupo muscular o tipo',
  'onboarding.backup.title': 'Backup y Privacidad',
  'onboarding.backup.bullet1': 'Todos tus datos se quedan en tu dispositivo',
  'onboarding.backup.bullet2': 'Exporta e importa copias de seguridad',
  'onboarding.backup.bullet3': 'Sin cuenta ni internet necesarios',
  'onboarding.ready.title': '\u00BFListo para entrenar?',
  'onboarding.ready.subtitle': '\u00A1Tu diario de gym est\u00E1 listo. Vamos!',
  'onboarding.getStarted': 'Empezar',
  'onboarding.skip': 'Saltar',
};
