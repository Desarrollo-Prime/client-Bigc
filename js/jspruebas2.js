// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let authToken = null;
const ROLES = {
    SUPER_ADMIN: 'SuperAdministrador',
    ADMIN: 'Administrador',
    USER: 'Usuario'
};

// --- DOM Elements ---
// General
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const welcomeUser = document.getElementById('welcome-user');
const welcomeMessage = document.getElementById('welcome-message');
const viewTitle = document.getElementById('view-title');
const adminMenu = document.getElementById('admin-menu');

// Views
const dashboardView = document.getElementById('dashboard-view');
const userManagementView = document.getElementById('user-management-view');
const createUserView = document.getElementById('create-user-view');
const docManagementView = document.getElementById('doc-management-view');
const createDocView = document.getElementById('create-doc-view');
const areasView = document.getElementById('areas-view');
const createAreaView = document.getElementById('create-area-view');
const auditLogView = document.getElementById('audit-log-view');

// User Management Elements
const userList = document.getElementById('user-list');
const userMessage = document.getElementById('user-message');
const userFormMessage = document.getElementById('user-form-message');
const createUserForm = document.getElementById('create-user-form');
const userIdInput = document.getElementById('user-id');
const userUsernameInput = document = document.getElementById('user-username');
const userPasswordInput = document.getElementById('user-password');
const userRoleSelect = document.getElementById('user-role');
const saveUserBtn = document.getElementById('save-user-btn');
const cancelUserBtn = document.getElementById('cancel-user-btn');
const userSearch = document.getElementById('user-search');
const createUserBtn = document.getElementById('create-user-btn');

// Document Management Elements
const docList = document.getElementById('doc-list');
const docMessage = document.getElementById('doc-message');
const docFormMessage = document.getElementById('doc-form-message');
const createDocumentForm = document.getElementById('create-document-form');
const docCompany = document.getElementById('doc-company');
const docArea = document.getElementById('doc-area');
const docName = document.getElementById('doc-name');
const docDescription = document.getElementById('doc-description');
const docStatus = document.getElementById('doc-status');
const docFile = document.getElementById('doc-file');
const saveDocBtn = document.getElementById('save-doc-btn');
const cancelDocBtn = document.getElementById('cancel-doc-btn');
const docSearch = document.getElementById('doc-search');
const createDocBtn = document.getElementById('create-doc-btn');
const replaceDocFileBtn = document.getElementById('replace-doc-file-btn'); // Botón para reemplazar archivo
let currentDocumentFile = null; // Para guardar la URL del archivo actual al editar

// Area Management Elements
const areaList = document.getElementById('area-list');
const areaMessage = document.getElementById('area-message');
const areaFormMessage = document.getElementById('area-form-message');
const createAreaForm = document.getElementById('create-area-form');
const areaIdInput = document.getElementById('area-id');
const areaNameInput = document.getElementById('area-name');
const saveAreaBtn = document.getElementById('save-area-btn');
const cancelAreaBtn = document.getElementById('cancel-area-btn');
const areaSearch = document.getElementById('area-search');
const createAreaBtn = document.getElementById('create-area-btn');

// Audit Log Elements
const auditLogList = document.getElementById('audit-log-list');
const auditLogSearch = document.getElementById('audit-log-search');

// --- Utility Functions ---

/**
 * Muestra un mensaje de alerta en la interfaz de usuario.
 * @param {HTMLElement} element - El elemento donde se mostrará la alerta.
 * @param {string} message - El mensaje a mostrar.
 * @param {'success'|'danger'|'info'} type - El tipo de alerta (para estilos CSS).
 */
function showAlert(element, message, type) {
    element.textContent = message;
    element.className = `alert alert-${type}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

/**
 * Oculta todas las vistas y muestra la vista especificada.
 * @param {HTMLElement} viewElement - El elemento de la vista a mostrar.
 * @param {string} title - El título de la vista.
 */
function showView(viewElement, title) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    viewElement.style.display = 'block';
    viewTitle.textContent = title;
}

/**
 * Realiza una solicitud a la API.
 * @param {string} endpoint - El endpoint de la API (ej. '/users').
 * @param {string} method - El método HTTP (ej. 'GET', 'POST', 'PUT', 'DELETE').
 * @param {object|FormData|null} body - El cuerpo de la solicitud.
 * @param {boolean} requiresAuth - Si la solicitud requiere token de autenticación.
 * @param {boolean} isFormData - Si el cuerpo de la solicitud es FormData.
 * @returns {Promise<object>} La respuesta parseada como JSON.
 */
async function apiFetch(endpoint, method, body = null, requiresAuth = true, isFormData = false) {
    const headers = {};
    if (requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log(`[apiFetch] Sending Authorization header: Bearer ${authToken.substring(0, 20)}...`); // Log el token (parcial)
    } else if (requiresAuth && !authToken) {
        console.warn('[apiFetch] Attempted to make authenticated request but authToken is missing.');
    }

    // Si no es FormData, establece Content-Type a application/json.
    // FormData maneja su propio Content-Type (multipart/form-data)
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        // Asegúrate de que las cabeceras (incluyendo Authorization) siempre se pasen.
        // El Content-Type para FormData lo maneja automáticamente el navegador.
        headers: headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : null),
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (response.ok) {
            if (response.status === 204) { // No Content
                return {};
            }
            return response.json();
        } else {
            const errorData = await response.json();
            if (response.status === 401) {
                // Si el token expira o es inválido, redirige al login
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                initApp(); // Vuelve a la pantalla de login
                throw new Error(errorData.message || 'No autorizado: Token inválido o expirado. Por favor, inicie sesión de nuevo.');
            }
            throw new Error(errorData.message || 'Error en la solicitud API');
        }
    } catch (error) {
        console.error('Error en apiFetch:', error);
        throw error; // Re-lanza el error para que sea manejado por la función que llamó a apiFetch
    }
}


// --- Authentication Functions ---

/**
 * Maneja el inicio de sesión del usuario.
 */
async function login() {
    const username = usernameInput.value.trim(); // Eliminar espacios en blanco
    const password = passwordInput.value;

    // Validar que los campos no estén vacíos antes de enviar la solicitud
    if (!username) {
        showAlert(loginError, 'El nombre de usuario es obligatorio.', 'danger');
        return;
    }
    if (!password) {
        showAlert(loginError, 'La contraseña es obligatoria.', 'danger');
        return;
    }

    // Opcional: Log para depuración, para ver qué se está enviando
    console.log('[Login] Intentando iniciar sesión con:', { username, password: '***' });

    try {
        // *** INICIO DE LA CORRECCIÓN ***
        // Se cambia 'username' a 'email' en el payload de la solicitud.
        // Esto es una suposición para resolver el error "property username should not exist"
        // si el backend espera un campo diferente para el identificador de usuario.
        const response = await apiFetch('/auth/login', 'POST', { email: username, password }, false);
        // *** FIN DE LA CORRECCIÓN ***

        authToken = response.access_token;
        currentUser = response.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        initAppUI();
        showView(dashboardView, 'Dashboard');
        loginError.style.display = 'none'; // Oculta cualquier error previo
    } catch (error) {
        console.error('Error de inicio de sesión:', error);
        showAlert(loginError, error.message || 'Credenciales inválidas. Intente de nuevo.', 'danger');
    }
}

/**
 * Maneja el cierre de sesión del usuario.
 */
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    initApp(); // Vuelve a la pantalla de login
}

/**
 * Inicializa la interfaz de usuario de la aplicación después del login.
 */
function initAppUI() {
    loginScreen.style.display = 'none';
    appContainer.style.display = 'flex';
    document.body.classList.add('logged-in');
    welcomeUser.textContent = currentUser ? currentUser.username : 'Invitado';
    welcomeMessage.textContent = currentUser ? `Bienvenido, ${currentUser.username}!` : 'Bienvenido!';

    // Control de visibilidad del menú de administración
    if (currentUser && (currentUser.role === ROLES.SUPER_ADMIN || currentUser.role === ROLES.ADMIN)) {
        adminMenu.style.display = 'block';
    } else {
        adminMenu.style.display = 'none';
    }
}

// --- User Management Functions ---

/**
 * Carga y muestra la lista de usuarios.
 */
async function loadUsers() {
    try {
        const users = await apiFetch('/users', 'GET');
        userList.innerHTML = ''; // Limpiar lista existente
        if (users.length === 0) {
            userList.innerHTML = '<tr><td colspan="5" class="text-center">No hay usuarios registrados.</td></tr>';
            return;
        }
        users.forEach(user => {
            const row = userList.insertRow();
            row.insertCell().textContent = user.id;
            row.insertCell().textContent = user.username;
            row.insertCell().textContent = user.role;
            row.insertCell().textContent = new Date(user.createdAt).toLocaleDateString();
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-info edit-user-btn" data-id="${user.id}">Editar</button>
                <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}">Eliminar</button>
            `;
        });
        document.querySelectorAll('.edit-user-btn').forEach(btn => btn.addEventListener('click', editUser));
        document.querySelectorAll('.delete-user-btn').forEach(btn => btn.addEventListener('click', deleteUser));
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showAlert(userMessage, error.message || 'Error al cargar usuarios.', 'danger');
    }
}

/**
 * Muestra el formulario para crear/editar un usuario.
 * @param {object|null} user - Datos del usuario a editar, o null para crear uno nuevo.
 */
function showUserForm(user = null) {
    showView(createUserView, user ? 'Editar Usuario' : 'Crear Usuario');
    createUserForm.reset();
    userFormMessage.style.display = 'none'; // Ocultar mensajes de error anteriores

    if (user) {
        userIdInput.value = user.id;
        userUsernameInput.value = user.username;
        userRoleSelect.value = user.role;
        userPasswordInput.placeholder = 'Dejar vacío para mantener la contraseña actual';
        userPasswordInput.required = false; // Contraseña no es obligatoria al editar
        saveUserBtn.dataset.userId = user.id;
    } else {
        userIdInput.value = '';
        userPasswordInput.placeholder = 'Contraseña';
        userPasswordInput.required = true; // Contraseña es obligatoria al crear
        delete saveUserBtn.dataset.userId;
    }
}

/**
 * Maneja el guardado de un usuario (creación o edición).
 */
async function saveUser() {
    const userId = saveUserBtn.dataset.userId;
    const username = userUsernameInput.value;
    const password = userPasswordInput.value;
    const role = userRoleSelect.value;

    if (!username || !role || (!userId && !password)) {
        showAlert(userFormMessage, 'Los campos "Nombre de Usuario", "Rol" y "Contraseña" (para nuevos usuarios) son obligatorios.', 'danger');
        return;
    }

    const userData = { username, role };
    if (password) { // Solo incluye la contraseña si se proporciona
        userData.password = password;
    }

    let method = 'POST';
    let endpoint = '/users';

    if (userId) {
        method = 'PUT';
        endpoint = `/users/${userId}`;
    }

    try {
        const response = await apiFetch(endpoint, method, userData);
        showAlert(userMessage, `Usuario ${userId ? 'actualizado' : 'creado'} exitosamente.`, 'success');
        showView(userManagementView, 'Gestión de Usuarios');
        loadUsers();
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showAlert(userFormMessage, error.message || 'Error al guardar usuario.', 'danger');
    }
}

/**
 * Maneja la edición de un usuario.
 * @param {Event} event - El evento click.
 */
async function editUser(event) {
    const userId = event.target.dataset.id;
    try {
        const user = await apiFetch(`/users/${userId}`, 'GET');
        showUserForm(user);
    } catch (error) {
        console.error('Error al cargar usuario para editar:', error);
        showAlert(userMessage, error.message || 'Error al cargar usuario para editar.', 'danger');
    }
}

/**
 * Maneja la eliminación de un usuario.
 * @param {Event} event - El evento click.
 */
async function deleteUser(event) {
    const userId = event.target.dataset.id;
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) { // Considerar reemplazar con un modal personalizado
        try {
            await apiFetch(`/users/${userId}`, 'DELETE');
            showAlert(userMessage, 'Usuario eliminado exitosamente.', 'success');
            loadUsers();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            showAlert(userMessage, error.message || 'Error al eliminar usuario.', 'danger');
        }
    }
}

// --- Document Management Functions ---

/**
 * Carga y muestra la lista de documentos.
 */
async function loadDocuments() {
    try {
        const query = docSearch.value;
        const documents = await apiFetch(`/documents?search=${query}`, 'GET');
        docList.innerHTML = ''; // Limpiar lista existente
        if (documents.length === 0) {
            docList.innerHTML = '<tr><td colspan="7" class="text-center">No hay documentos registrados.</td></tr>';
            return;
        }
        documents.forEach(doc => {
            const row = docList.insertRow();
            row.insertCell().textContent = doc.id;
            row.insertCell().textContent = doc.name;
            row.insertCell().textContent = doc.company ? doc.company.name : 'N/A';
            row.insertCell().textContent = doc.area ? doc.area.name : 'N/A';
            row.insertCell().textContent = doc.status ? doc.status.name : 'N/A';
            row.insertCell().innerHTML = doc.fileUrl ? `<a href="${doc.fileUrl}" target="_blank" class="text-blue-500 hover:underline">Ver Archivo</a>` : 'Sin Archivo';
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-info edit-doc-btn" data-id="${doc.id}">Editar</button>
                <button class="btn btn-sm btn-danger delete-doc-btn" data-id="${doc.id}">Eliminar</button>
            `;
        });
        document.querySelectorAll('.edit-doc-btn').forEach(btn => btn.addEventListener('click', editDocument));
        document.querySelectorAll('.delete-doc-btn').forEach(btn => btn.addEventListener('click', deleteDocument));
    } catch (error) {
        console.error('Error al cargar documentos:', error);
        showAlert(docMessage, error.message || 'Error al cargar documentos.', 'danger');
    }
}

/**
 * Carga las compañías y áreas para los selectores del formulario de documentos.
 */
async function loadDocumentFormOptions() {
    try {
        const companies = await apiFetch('/companies', 'GET');
        const areas = await apiFetch('/areas', 'GET');
        const statuses = await apiFetch('/document-statuses', 'GET'); // Asumiendo un endpoint para estados

        // Llenar selector de Compañías
        docCompany.innerHTML = '<option value="">Seleccione una Compañía</option>';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            docCompany.appendChild(option);
        });

        // Llenar selector de Áreas
        docArea.innerHTML = '<option value="">Seleccione un Área (Opcional)</option>';
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.name;
            docArea.appendChild(option);
        });

        // Llenar selector de Estados
        docStatus.innerHTML = '<option value="">Seleccione un Estado</option>';
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            docStatus.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar opciones del formulario de documento:', error);
        showAlert(docFormMessage, 'Error al cargar opciones del formulario.', 'danger');
    }
}

/**
 * Muestra el formulario para crear/editar un documento.
 * @param {object|null} doc - Datos del documento a editar, o null para crear uno nuevo.
 */
async function showDocumentForm(doc = null) {
    showView(createDocView, doc ? 'Editar Documento' : 'Crear Documento');
    createDocumentForm.reset();
    docFormMessage.style.display = 'none'; // Ocultar mensajes de error anteriores
    docFile.required = !doc; // Archivo es obligatorio al crear, no al editar por defecto
    currentDocumentFile = null; // Resetear el archivo actual

    await loadDocumentFormOptions(); // Cargar opciones cada vez que se abre el formulario

    if (doc) {
        saveDocBtn.dataset.docId = doc.id;
        docCompany.value = doc.companyId || '';
        docArea.value = doc.areaId || '';
        docName.value = doc.name;
        docDescription.value = doc.description || '';
        docStatus.value = doc.statusId || '';
        currentDocumentFile = doc.fileUrl; // Guardar la URL del archivo actual

        // Mostrar botón de reemplazar archivo y ocultar input de archivo si ya existe
        if (doc.fileUrl) {
            replaceDocFileBtn.style.display = 'block';
            docFile.style.display = 'none';
        } else {
            replaceDocFileBtn.style.display = 'none';
            docFile.style.display = 'block';
        }

    } else {
        delete saveDocBtn.dataset.docId;
        replaceDocFileBtn.style.display = 'none';
        docFile.style.display = 'block';
    }
}

/**
 * Habilita el input de archivo para reemplazar el documento existente.
 */
function replaceDocumentFile() {
    docFile.style.display = 'block';
    docFile.required = true; // Hacer el input de archivo obligatorio al reemplazar
    replaceDocFileBtn.style.display = 'none'; // Ocultar el botón de reemplazar
}

/**
 * Maneja el guardado de un documento (creación o edición).
 */
async function saveDocument() {
    const docId = saveDocBtn.dataset.docId;
    // Obtener los valores de los campos
    const companyValue = docCompany.value;
    const areaValue = docArea.value;
    const name = docName.value;
    const description = docDescription.value;
    const statusValue = docStatus.value;
    const file = docFile.files[0];

    // Validaciones iniciales de campos obligatorios
    if (!name || !companyValue || !statusValue || (!docId && !file)) {
        showAlert(docFormMessage, 'Los campos "Nombre del Documento", "Compañía", "Estado" y "Archivo" (para nuevos documentos) son obligatorios.', 'danger');
        return;
    }

    // Convertir a número los IDs de compañía, área y estado
    // Se usa Number() en lugar de parseInt() para asegurar que un string vacío se convierta a 0,
    // y luego se maneja la lógica de null para el área.
    const companyId = Number(companyValue);
    const areaId = areaValue ? Number(areaValue) : null;
    const statusId = Number(statusValue);

    // Validar que los IDs numéricos sean válidos (no NaN)
    if (isNaN(companyId) || isNaN(statusId) || (areaId !== null && isNaN(areaId))) {
        showAlert(docFormMessage, 'Los IDs de Compañía, Área (si se selecciona) y Estado deben ser números válidos. Por favor, seleccione una opción válida.', 'danger');
        return;
    }

    // Preparar los metadatos como un objeto JavaScript
    // Estos metadatos se enviarán como una cadena JSON dentro del FormData
    const metadata = {
        companyId: companyId,
        name: name,
        description: description,
        statusId: statusId
    };
    if (areaId !== null) { // Solo añadir areaId si no es null
        metadata.areaId = areaId;
    }

    const formData = new FormData();
    // Añadir los metadatos como una cadena JSON bajo la clave 'data'.
    // Tu backend NestJS deberá estar configurado para parsear este campo 'data' como JSON.
    // Por ejemplo, en tu controlador NestJS: @Body('data') data: string, y luego JSON.parse(data)
    formData.append('data', JSON.stringify(metadata));

    let method = 'POST';
    let endpoint = '/documents';

    if (docId) { // Editar documento
        method = 'PUT';
        endpoint = `/documents/${docId}`;
        // Solo añadir el archivo si se seleccionó uno nuevo para reemplazar
        if (file) {
            formData.append('file', file);
        }
        // Si no se seleccionó un nuevo archivo y hay uno actual, no se envía 'file' en el FormData.
        // El backend debe estar configurado para mantener el archivo existente si 'file' no se envía en PUT.
    } else { // Crear nuevo documento
        formData.append('file', file);
    }

    try {
        // La llamada a apiFetch con true, true asegurará que el token se envíe y el FormData sea manejado correctamente.
        const response = await apiFetch(endpoint, method, formData, true, true);
        showAlert(docMessage, `Documento ${docId ? 'actualizado' : 'subido'} exitosamente.`, 'success');
        showView(docManagementView, 'Gestión Documental');
        loadDocuments();
    } catch (error) {
        console.error('Error al guardar documento:', error);
        showAlert(docFormMessage, error.message || 'Error al guardar documento.', 'danger');
    }
}

/**
 * Maneja la edición de un documento.
 * @param {Event} event - El evento click.
 */
async function editDocument(event) {
    const docId = event.target.dataset.id;
    try {
        const doc = await apiFetch(`/documents/${docId}`, 'GET');
        showDocumentForm(doc);
    } catch (error) {
        console.error('Error al cargar documento para editar:', error);
        showAlert(docMessage, error.message || 'Error al cargar documento para editar.', 'danger');
    }
}

/**
 * Maneja la eliminación de un documento.
 * @param {Event} event - El evento click.
 */
async function deleteDocument(event) {
    const docId = event.target.dataset.id;
    if (confirm('¿Está seguro de que desea eliminar este documento?')) { // Considerar reemplazar con un modal personalizado
        try {
            await apiFetch(`/documents/${docId}`, 'DELETE');
            showAlert(docMessage, 'Documento eliminado exitosamente.', 'success');
            loadDocuments();
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            showAlert(docMessage, error.message || 'Error al eliminar documento.', 'danger');
        }
    }
}

// --- Area Management Functions ---

/**
 * Carga y muestra la lista de áreas.
 */
async function loadAreas() {
    try {
        const query = areaSearch.value;
        const areas = await apiFetch(`/areas?search=${query}`, 'GET');
        areaList.innerHTML = ''; // Limpiar lista existente
        if (areas.length === 0) {
            areaList.innerHTML = '<tr><td colspan="4" class="text-center">No hay áreas registradas.</td></tr>';
            return;
        }
        areas.forEach(area => {
            const row = areaList.insertRow();
            row.insertCell().textContent = area.id;
            row.insertCell().textContent = area.name;
            row.insertCell().textContent = new Date(area.createdAt).toLocaleDateString();
            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="btn btn-sm btn-info edit-area-btn" data-id="${area.id}">Editar</button>
                <button class="btn btn-sm btn-danger delete-area-btn" data-id="${area.id}">Eliminar</button>
            `;
        });
        document.querySelectorAll('.edit-area-btn').forEach(btn => btn.addEventListener('click', editArea));
        document.querySelectorAll('.delete-area-btn').forEach(btn => btn.addEventListener('click', deleteArea));
    } catch (error) {
        console.error('Error al cargar áreas:', error);
        showAlert(areaMessage, error.message || 'Error al cargar áreas.', 'danger');
    }
}

/**
 * Muestra el formulario para crear/editar un área.
 * @param {object|null} area - Datos del área a editar, o null para crear una nueva.
 */
function showAreaForm(area = null) {
    showView(createAreaView, area ? 'Editar Área' : 'Crear Área');
    createAreaForm.reset();
    areaFormMessage.style.display = 'none'; // Ocultar mensajes de error anteriores

    if (area) {
        areaIdInput.value = area.id;
        areaNameInput.value = area.name;
        saveAreaBtn.dataset.areaId = area.id;
    } else {
        areaIdInput.value = '';
        delete saveAreaBtn.dataset.areaId;
    }
}

/**
 * Maneja el guardado de un área (creación o edición).
 */
async function saveArea() {
    const areaId = saveAreaBtn.dataset.areaId;
    const name = areaNameInput.value;

    if (!name) {
        showAlert(areaFormMessage, 'El campo "Nombre del Área" es obligatorio.', 'danger');
        return;
    }

    const areaData = { name };

    let method = 'POST';
    let endpoint = '/areas';

    if (areaId) {
        method = 'PUT';
        endpoint = `/areas/${areaId}`;
    }

    try {
        const response = await apiFetch(endpoint, method, areaData);
        showAlert(areaMessage, `Área ${areaId ? 'actualizada' : 'creada'} exitosamente.`, 'success');
        showView(areasView, 'Áreas');
        loadAreas();
    } catch (error) {
        console.error('Error al guardar área:', error);
        showAlert(areaFormMessage, error.message || 'Error al guardar área.', 'danger');
    }
}

/**
 * Maneja la edición de un área.
 * @param {Event} event - El evento click.
 */
async function editArea(event) {
    const areaId = event.target.dataset.id;
    try {
        const area = await apiFetch(`/areas/${areaId}`, 'GET');
        showAreaForm(area);
    } catch (error) {
        console.error('Error al cargar área para editar:', error);
        showAlert(areaMessage, error.message || 'Error al cargar área para editar.', 'danger');
    }
}

/**
 * Maneja la eliminación de un área.
 * @param {Event} event - El evento click.
 */
async function deleteArea(event) {
    const areaId = event.target.dataset.id;
    if (confirm('¿Está seguro de que desea eliminar esta área?')) { // Considerar reemplazar con un modal personalizado
        try {
            await apiFetch(`/areas/${areaId}`, 'DELETE');
            showAlert(areaMessage, 'Área eliminada exitosamente.', 'success');
            loadAreas();
        } catch (error) {
            console.error('Error al eliminar área:', error);
            showAlert(areaMessage, error.message || 'Error al eliminar área.', 'danger');
        }
    }
}

// --- Audit Log Functions ---

/**
 * Carga y muestra el registro de auditoría.
 */
async function loadAuditLog() {
    try {
        const query = auditLogSearch.value;
        const logs = await apiFetch(`/audit-logs?search=${query}`, 'GET');
        auditLogList.innerHTML = ''; // Limpiar lista existente
        if (logs.length === 0) {
            auditLogList.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros de auditoría.</td></tr>';
            return;
        }
        logs.forEach(log => {
            const row = auditLogList.insertRow();
            row.insertCell().textContent = log.id;
            row.insertCell().textContent = log.action;
            row.insertCell().textContent = log.userId ? log.userId : 'N/A'; // Asumiendo que userId es el nombre de usuario
            row.insertCell().textContent = log.details;
            row.insertCell().textContent = new Date(log.timestamp).toLocaleString();
        });
    } catch (error) {
        console.error('Error al cargar el registro de auditoría:', error);
        showAlert(auditLogMessage, error.message || 'Error al cargar el registro de auditoría.', 'danger');
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Login Screen Listeners
    loginBtn.addEventListener('click', login);
    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
    passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });

    // General App Listeners
    logoutBtn.addEventListener('click', logout);
    document.getElementById('nav-dashboard').addEventListener('click', () => showView(dashboardView, 'Dashboard'));
    document.getElementById('nav-users').addEventListener('click', () => { showView(userManagementView, 'Gestión de Usuarios'); loadUsers(); });
    document.getElementById('nav-documents').addEventListener('click', () => { showView(docManagementView, 'Gestión Documental'); loadDocuments(); });
    document.getElementById('nav-areas').addEventListener('click', () => { showView(areasView, 'Áreas'); loadAreas(); });
    document.getElementById('nav-audit-log').addEventListener('click', () => { showView(auditLogView, 'Registro de Auditoría'); loadAuditLog(); });

    // User Management Listeners
    createUserBtn.addEventListener('click', () => showUserForm());
    saveUserBtn.addEventListener('click', saveUser);
    cancelUserBtn.addEventListener('click', () => { showView(userManagementView, 'Gestión de Usuarios'); loadUsers(); });
    userSearch.addEventListener('input', loadUsers);

    // Document Management Listeners
    createDocBtn.addEventListener('click', () => showDocumentForm());
    saveDocBtn.addEventListener('click', saveDocument);
    cancelDocBtn.addEventListener('click', () => { showView(docManagementView, 'Gestión Documental'); loadDocuments(); });
    docSearch.addEventListener('input', loadDocuments);
    replaceDocFileBtn.addEventListener('click', replaceDocumentFile); // Botón para reemplazar archivo

    // Area Management Listeners
    createAreaBtn.addEventListener('click', () => showAreaForm());
    saveAreaBtn.addEventListener('click', saveArea);
    cancelAreaBtn.addEventListener('click', () => { showView(areasView, 'Áreas'); loadAreas(); });
    areaSearch.addEventListener('input', loadAreas);

    // --- Initial App Load ---
    /**
     * Inicializa la aplicación al cargar el DOM.
     * Verifica si hay una sesión activa y la restaura, o muestra la pantalla de login.
     */
    function initApp() {
        authToken = localStorage.getItem('authToken');
        currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (authToken && currentUser) {
            initAppUI();
            showView(dashboardView, 'Dashboard');
        } else {
            loginScreen.style.display = 'flex';
            appContainer.style.display = 'none';
            document.body.classList.remove('logged-in');
        }
    }

    initApp(); // Llama a initApp al cargar el DOM
});
