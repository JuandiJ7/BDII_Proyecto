# Trabajo obligatorio - Primer Semestre 2025
## Juan Diego Jacques - Fernando Sánchez
### Tecnologías utilizadas
- Frontend: Angular
- Backend: Fastify (Node.js)
- Base de datos: MySQL
- Proxy: Nginx
- Contenedores: Docker & Docker Compose
### Cómo ejecutar el proyecto
### Requisitos
- Docker
- Docker Compose
### Pasos
1. Clonar el repositorio:
git clone https://github.com/JuandiJ7/BDII_Proyecto
cd BDII_Proyecto
2. Levantar los servicios:
docker compose up --build
3. Acceder a la app:
- Frontend: http://localhost
- Backend (API): http://localhost/back
### Funcionalidades esperadas
- Registro e inicio de sesión.
- Alta de elecciones, circuitos, mesas, papeletas, partidos y listas.
- Emisión de voto (único por elección).
- Control de votos observados.
- Cierre de mesas y bloqueo posterior.
- Reportes por circuito, partido y departamento.
### Scripts y datos
- base/init.sql: creación del esquema y datos iniciales.

## Letra del trabajo
En Uruguay, el día 11 de mayo se cierra el ciclo electoral 2024-2025
Ese día se celebrarán las Elecciones Municipales, donde se elegirán a los
intendentes de cada departamento, a las juntas electorales y a los alcaldes
de cada municipio
La Corte Electoral fue autorizada a desarrollar un sistema para poder votar
de forma electrónica, y recurre a ustedes para desarrollar el primer MVP. De
éste, se espera que el entregable final tenga una base de datos desarrollada
por completo, y una aplicación sencilla que sirva como interfaz, y que posea
algunas funcionalidades básicas.
En las elecciones participan votantes, ciudadanos mayores de 18 años que
tramitaron su Credencial Cívica. De ellos, se sabe además nombre completo
y Cédula de Identidad. Se confecciona una lista para definir en qué circuito
vota cada ciudadano, siendo la Credencial Cívica la que define en qué zona
le puede tocar votar a esa persona.
Cada zona tiene establecimientos, que pueden ser en Escuelas, Liceos,
Universidades etc, y cada establecimiento tiene varios circuitos. Cada
circuito tiene una lista de Credenciales autorizadas a votar allí (usualmente
es una lista de credenciales consecutivas) y una mesa, compuesta por tres
ciudadanos: presidente, secretario y vocal. Además, a los establecimientos
se asignan agentes de la policía que están fijos allí todo el día. De ellos
interesa saber su nombre completo, CI, CC y a qué comisaría pertenecen.
Una aclaración, es que estos agentes pueden pertenecer a comisarías que
estén en otro departamento distinto de donde se encuentra el circuito.
Los circuitos pertenecen a un departamento específico, y de ellos se sabe
además del departamento, el pueblo, ciudad o paraje (para circuitos rurales)
donde se encuentra, y el barrio o zona. Además, se sabe si el circuito es
accesible o no. De los miembros de la mesa se sabe en qué organismo del
Estado trabajan (los miembros de la mesa son empleados públicos), su fecha
de nacimiento, nombre, CI y CC.
Hay que recordar que el voto es obligatorio y secreto. Por lo tanto, se debe
registrar que una persona votó, pero no debe ser posible trackear a quién
votó esa persona. Cómo solucionar este problema es parte del desafío de
este trabajo. Del voto se sabe a qué lista (o listas) fue emitido, si finalmente
se contó como válido, anulado (ver apéndice donde se define cómo anular
un voto) o si fue en blanco (es decir, no eligió a ningún candidato). Además,
se sabe en qué circuito fue emitido el voto, si fue observado (es decir, si la
persona no votó donde le correspondía votar por padrón) y a qué fecha y
hora se emitió.


El software debe poder usarse en distintas elecciones, ya sean
presidenciales, ballotage (comúnmente conocido como "segunda vuelta",
donde solo se enfrentan dos fórmulas presidenciales sin listas), elecciones
municipales, plebiscitos o referéndums (ver apéndice con definición de
qué significa cada una de estas palabras). Esto implica que para cada
elección se debe definir una fecha, un tipo, y un conjunto de papeletas que
pueden o no ser listas. En el caso de un ballotage, solamente hay dos
papeletas, una con cada fórmula presidencial. En el caso de un referéndum
o un plebiscito, puede haber dos papeletas (una por SI y otra por NO) o una
sola (por SI o por NO dependiendo del caso). En estos casos, estas papeletas
tienen un color específico (que puede repetirse en elecciones distintas). Una
aclaración, es que pueden desarrollarse en simultáneo dos o más elecciones
(como en el caso de elecciones presidenciales que además tienen un
plebiscito o un referéndum) y en estos casos el voto es único y debe
registrar tanto las listas elegidas como la (o las) papeleta(s) incluidas en él.
Las listas pertenecen a un partido político. De estas, se sabe el número (no
se puede repetir), el partido al que pertenecen, las personas que la integran,
a qué órgano son candidatos (diputados, senadores, junta departamental
[ediles] o concejales [municipios]) y el orden en el que aparecen. Además, se
sabe a qué candidato apoyan (en el caso de las elecciones municipales o las
internas, hay varios candidatos por partido) y a qué departamento
pertenecen (esto solo para listas a diputados o elecciones municipales, los
senadores se eligen a nivel nacional)
De los partidos se conoce la dirección de la sede, la composición de sus
autoridades (presidente y vicepresidente)
De los candidatos (en general) se conoce su nombre, CI, CC, partido al que
pertenecen para una elección puntual y a qué lista pertenecen.


El sistema
En esta primera versión del MVP, se espera que se pueda simular una
elección presidencial. En estos comicios, la ciudadanía elige entre
candidatos a intendente de cada departamento (hasta 3 por partido y por
departamento), las listas a la junta departamental (los ediles) y los alcaldes
de cada municipio. En estas elecciones, se aplica la denominada “ley de
lemas”, por la cual el candidato ganador es el candidato más votado del
partido más votado (no necesariamente el candidato más votado). Esto es
importante para la consulta que devuelva qué candidato ganó en cada
departamento.
Se puede agregar como extra que el sistema soporte además alguno de los
otros tipos de elecciones, quedando esto a criterio del grupo. Sí debe
tenerse en cuenta que el modelo debe ser extensible para soportar los
demás tipos de elecciones en futuras versiones del sistema.
¿Cómo funcionaría?
Empecemos por registrarnos e ingresar el circuito donde votamos. Tenga
en cuenta que si no coincide con el que nos tocó, el voto se marca como
observado y debe ser autorizado por el presidente de la mesa (en el sistema
actual, se coloca el sobre dentro de un sobre blanco y se contabiliza por
separado). El sistema me dará la posibilidad de votar y obviamente no podré
ingresar más de un voto por elección.
Cuando cada ciudadano vote en un circuito, se incrementará el contador de
votos emitidos de ese circuito, no quedando registro de a quién votó un
ciudadano (EL VOTO ES SECRETO)
Esta aplicación debería poder ser usada tanto por los ciudadanos que votan
como por el presidente de la mesa de votación por ejemplo, el cual obtendrá
los resultados cuando la votación finalice en ese circuito. Al momento en
que se cierra la mesa, el sistema no debe permitir que se ingresen más votos
en esa mesa. El sistema tampoco debe permitir visualizar los resultados
antes de que se cierre la mesa, ni volver a abrir una mesa una vez cerrada.
La mesa se cierra
El Sistema debe tener en cuenta que a futuro puede interesar sacar
estadísticas de cómo son los porcentajes de votación de los distintos
candidatos, tanto por circuito, como por departamento y a nivel país.
Mínimamente se requieren contar con reportes o consultas como por
ejemplo:

![image](https://github.com/user-attachments/assets/78d27cb2-265c-4f90-9e2e-bb922ba28c23)


Debe contarse también con un listado idéntico a los últimos dos, pero
clasificados de forma general por departamento. Además, se debe contar
con una consulta que nos diga qué candidato ganó la elección en cada
departamento.
Las funcionalidades de esta app estarán limitadas solo por su imaginación, y
en ello residirá el valor que tenga. Mínimamente deberá contemplar
factores como los descriptos previamente, como multiusuario y el obvio uso
de una base de datos SQL.


Se le pide que investigue con las personas de su grupo cómo se podría
resolver este problema. Luego de ello, modélelo, incluyendo todo lo que el
problema representa, sus desafíos y la lógica necesaria para funcionar.
Además, debe armar la base de datos que se necesita.
Una vez lograda la base de datos, trabaje en elaborar la aplicación.
Considere que será un prototipo, por lo que debería ser posible que sea
extensible para mayores funcionalidades. ¿Su modelo es capaz de hacerlo
con facilidad?
La funcionalidad mínima es la de poder registrarse, cargar elecciones,
circuitos (con los datos asociados como departamento, integrantes del
circuito, etc), listas, partidos, candidatos, votantes, etc.
Deberá permitir ingresar un voto, cerrar la votación de un circuito, así
como visualizar los resultados obtenidos (tanto en cantidades como en
porcentajes), dependiendo las funcionalidades habilitadas según sea un
votante o miembro del circuito.
Se les pide que investiguen qué base de datos y qué lógica debería dar
sustento a los programas de las características solicitadas.


Entregables
● Programa funcional
● Scripts de SQL de creación del esquema y datos de prueba
● Informe del trabajo
● Repositorio público de GitHub (obligatorio)
Su aplicación deberá trabajar en modalidad “Cliente - Servidor”.
En cuanto al motor de bases de datos se utilizará MySQL, ya que para el
despliegue final de la aplicación, la base de datos estará hosteada en el
datacenter de la UCU. Se le brindará a su equipo más adelante las
credenciales de acceso al servidor.
El lenguaje de programación, tanto para backend como para frontend,
quedará a criterio de cada grupo — Se sugiere consultar previamente para
obtener un visto bueno de la Cátedra. Independientemente del lenguaje y
base de datos que se seleccione, la implementación deberá ser hecha en
MySQL. Para desplegar la aplicación se sugiere que utilicen una solución
con contenedores (Docker), opcionalmente con el uso de Docker Compose.
Se deberá asimismo crear un repositorio en Github donde se irán creando
Pull Requests con los avances del trabajo a lo largo del semestre. Se pide
que estos repositorios cuenten con un Readme adecuado (estudiar
markdown) que explicite con todo detalle cómo ejecutar la solución
localmente.
Se recomienda recurrir a la bibliografía y artículos aportados en el curso;
asimismo se recomienda la evaluación de productos disponibles en el
mercado de forma tal de aprovechar posibles ideas y elementos
implementados en dichas herramientas.
Restricciones:
● No se puede utilizar ningún ORM para:
○ consultas
○ generar scripts de modelo en base clases


En cuanto al informe, este deberá contar
● Un resumen de la información teórica utilizada (con un máximo de 30
carillas)
● Un análisis de las distintas alternativas evaluadas por el grupo.
● La elección de la alternativa a ser implementada, debidamente
justificada
● La implementación de dicha alternativa, documentando:
o El modelo de datos (MER, Modelo Lógico)
o La funcionalidad del mismo (diagrama de componentes, clases,
colaboración, algoritmos, etc.)
● Un breve capítulo de conclusiones, en el cual se pueda resumir los
aspectos más importantes del trabajo, cuáles son los próximos pasos,
o aquellos aspectos relevantes que se deseen concluir.
El tamaño total del informe no puede exceder las 35 páginas, no se
aceptarán trabajos que no cumplan con este requisito.
La documentación teórica debe contener las referencias a las fuentes de
donde tomó la información (con referencias en los párrafos
correspondientes) y en caso de incluir texto literal de alguna fuente DEBEN
hacerlo correctamente, utilice las normas APA (https://normasapa.com).
El ejecutable deberá ser acompañado de la documentación necesaria para
comprender su forma de trabajo y la manera de ejecutarlo. En el caso que
hayan ocurrido variaciones entre la implementación presentada en el
informe del trabajo y la confección del ejecutable se deberá agregar un
anexo que indique los cambios efectuados. Los únicos cambios aceptables
son aquellos que involucren cambios en la implementación de la solución
presentada y no en la solución propiamente dicha.
Se aclara que de no ser posible la ejecución del sistema por parte del
docente, se procederá a calificar con D el trabajo. Lo mismo sucederá si el
programa presenta errores de compilación.


Los entregables deberán ser subidos a Webasignatura.
Reglas de colaboración: El obligatorio es en grupo de 2 o 3 personas, los
integrantes son los responsables de la división del trabajo en forma
equitativa. El trabajo debe ser original, producido enteramente por ustedes.
Entregas tardías: No es posible entregar el obligatorio después de la fecha.
Entregas por email: No se aceptarán entregas por email excepto que Web
Asignatura no esté disponible seis horas antes a la fecha final de entrega. La
entrega por email debe enviarse a todos los profesores y pedirles
confirmación de entrega. Es su responsabilidad asegurarse que el trabajo
haya sido recibido.
Evaluación: La entrega será evaluada y se asignará una nota a cada uno de
los estudiantes, pudiéndose tomar defensas orales y/o escritas en el caso
que los profesores lo consideren necesario. La no presentación a las
defensas, provocará que el alumno no pueda ser evaluado y por ende, será
calificado con D (deficiente).
Entrega de la Letra: 23/04/2025
Primer entrega (avance): 26/05/2025
Entrega del MER 01/06/2025
Incluye MER, pasaje a tablas y Script SQL con la creación de la BD.
Entrega del Informe: 22/06/2025
Entrega del Ejecutable: 06/07/2025
Defensas: 07/07/2025 y 09/07/2025


### Anexo
Glosario
Voto en blanco: El voto es en blanco cuando dentro del sobre de votación no
se introduce nada o cuando se introduce cualquier otro elemento distinto a
una hoja de votación válida. Una hoja de votación no válida puede ser la de
un partido político que ya no está en la contienda electoral o pertenece a un
departamento distinto en el que se votó.
Voto anulado: Se anula el voto cuando dentro del sobre hay una hoja de
votación válida que por alguna razón debe invalidarse. Son cuatro las
circunstancias en las que procede la anulación del voto.
1. La primera es cuando dentro del sobre aparecen hojas de votación de
partidos políticos distintos, por ejemplo: una lista del Partido A y una lista
Partido B.
2. También se anula cuando en el sobre de votación se introdujo una
hoja de votación válida y cualquier otro objeto que no sea una hoja de
votación válida.
3. La tercera causal de anulación del voto se presenta cuando la hoja de
votación válida que está dentro del sobre tiene anotaciones agregadas, y
cuando tiene roturas y dobleces que demuestren la intención que tuvo el
votante de identificar su voto.
4. La cuarta circunstancia en la que se anula el voto es cuando dentro
del sobre de votación se introdujeron más de dos hojas de votación
idénticas.
Votos emitidos: Todos los votos efectivamente emitidos en una elección.
Esto incluye los votos a las listas, los votos en blanco y los anulados (es el
total de votos)
Votos válidos: Para el caso de un referéndum, plebiscito o ballotage, los
votos válidos (los que efectivamente cuentan para el resultado final) son
todos los votos menos los votos en blanco y anulado
Plebiscito: La Constitución reserva esta denominación ("plebiscito") para
nombrar al pronunciamiento del cuerpo electoral cuando es convocado
para decidir si se aprueba o no un proyecto de reforma constitucional.
Es, en definitiva, el cuerpo electoral, convocado a tales efectos, el que
expresa su conformidad en el plebiscito. Esto requiere mayorías que
varían según sea el origen del proyecto.
El plebiscito es la última etapa en el proceso de reforma constitucional.
Referéndum: El veinticinco por ciento (25%) del total de inscriptos
habilitados para votar podrá interponer el recurso del referéndum dentro
del año de promulgada una ley. La Constitución dispone que el referéndum
no será aplicable con respecto a las leyes que establezcan tributos, ni
tampoco en los casos en que la iniciativa (para la propuesta de la ley) sea
potestad del Poder Ejecutivo (artículo 79 de la Constitución de la R.O.U.). El
referéndum es el procedimiento que permite ratificar o rechazar una ley o
un decreto de la Junta departamental, dentro del año de su promulgación.
Junta departamental: Las juntas departamentales son los órganos
legislativos de cada departamento. Cuentan con 31 miembros llamados
ediles
Concejales: Autoridades de cada municipio. El presidente de esta junta de
concejales es el alcalde del municipio
