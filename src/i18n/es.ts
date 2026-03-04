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
  'workout.set': 'Serie {number}',
  'workout.weight': 'Peso',
  'workout.reps': 'Reps',
  'workout.rest': 'Descanso',

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
  'body.add.weight': 'Peso (kg)',
  'body.add.weightPlaceholder': 'ej. 80.5',
  'body.add.bodyFat': 'Grasa Corporal (%)',
  'body.add.bodyFatPlaceholder': 'ej. 15',
  'body.add.measurements': 'Medidas (cm)',
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
};
