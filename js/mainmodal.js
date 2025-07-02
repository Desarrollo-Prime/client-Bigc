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
const contentArea = document.getElementById('content-area');

// Stats elements
const usersCount = document.getElementById('users-count');
const docsCount = document.getElementById('docs-count');
const areasCount = document.getElementById('areas-count');

// User Management elements
const createUserBtn = document.getElementById('create-user-btn');
const saveUserBtn = document.getElementById('save-user-btn');
const cancelUserBtn = document.getElementById('cancel-user-btn');
const usersTableBody = document.getElementById('users-table-body');
const userSearch = document.getElementById('user-search');
const userMessage = document.getElementById('user-message');
const userFormMessage = document.getElementById('user-form-message');
const usersLoading = document.getElementById('users-loading');
const createUserInputTitle = document.getElementById('create-user-title');
const userStatusGroup = document.getElementById('user-status-group');

// User Form fields
const newNickname = document.getElementById('new-nickname');
const newEmail = document.getElementById('new-email');
const newPassword = document.getElementById('new-password');
const newFirstname = document.getElementById('new-firstname');
const newLastname = document.getElementById('new-lastname');
const newPhone = document.getElementById('new-phone');
const newRole = document.getElementById('new-role');
const newCompany = document.getElementById('new-company'); // Nuevo elemento DOM para Compañía
const editEnable = document.getElementById('edit-enable');
const editBlocked = document.getElementById('edit-blocked');

// Document Management elements
const createDocBtn = document.getElementById('create-doc-btn');
const saveDocBtn = document.getElementById('save-doc-btn');
const cancelDocBtn = document.getElementById('cancel-doc-btn');
const docSearch = document.getElementById('doc-search');
const docMessage = document.getElementById('doc-message');
const docsTableBody = document.getElementById('docs-table-body');
const docFormMessage = document.getElementById('doc-form-message');
const docsLoading = document.getElementById('docs-loading');
const createDocInputTitle = document.getElementById('create-doc-title');
const docFileGroup = document.getElementById('doc-file-group');
const docCurrentFileGroup = document.getElementById('doc-current-file-group');
const currentDocFilename = document.getElementById('current-doc-filename');
const replaceDocFileBtn = document.getElementById('replace-doc-file-btn');


// Document Form fields
const docName = document.getElementById('doc-name');
const docCompany = document.getElementById('doc-company');
const docArea = document.getElementById('doc-area');
const docStatus = document.getElementById('doc-status');
const docDescription = document.getElementById('doc-description');
const docFile = document.getElementById('doc-file');

// Document Viewer Modal elements
const documentViewerModal = document.getElementById('document-viewer-modal');
const modalDocTitle = document.getElementById('modal-doc-title');
const docViewerIframe = document.getElementById('doc-viewer-iframe');
const downloadDocBtn = document.getElementById('download-doc-btn');
const closeDocModal = document.getElementById('close-doc-modal');
const closeDocModalBtn = document.getElementById('close-doc-modal-btn');


// Area Management elements
const createAreaBtn = document.getElementById('create-area-btn');
const saveAreaBtn = document.getElementById('save-area-btn');
const cancelAreaBtn = document.getElementById('cancel-area-btn');
const areaSearch = document.getElementById('area-search');
const areaMessage = document.getElementById('area-message');
const areasTableBody = document.getElementById('areas-table-body');
const areaFormMessage = document.getElementById('area-form-message');
const areasLoading = document.getElementById('areas-loading');
const createAreaInputTitle = document.getElementById('create-area-title');


// Area Form fields
const areaName = document.getElementById('area-name');
const areaDescription = document.getElementById('area-description');
const areaCompany = document.getElementById('area-company');

// Custom Confirmation Modal elements
const customConfirmModal = document.getElementById('custom-confirm-modal');
const confirmModalMessage = document.getElementById('confirm-modal-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');
let confirmCallback = null;


// --- Utility Functions ---

/**
 * Muestra un modal de confirmación personalizado.
 * @param {string} message - El mensaje a mostrar en el modal.
 * @param {function} callback - La función a ejecutar si el usuario confirma.
 */
function showConfirmModal(message, callback) {
    confirmModalMessage.textContent = message;
    confirmCallback = callback;
    customConfirmModal.style.display = 'flex'; // Usar flex para centrar
}

/**
 * Oculta el modal de confirmación.
 */
function hideConfirmModal() {
    customConfirmModal.style.display = 'none';
    confirmCallback = null;
}

/**
 * Realiza una solicitud fetch a la API.
 * @param {string} endpoint - El endpoint de la API (ej: '/auth/login').
 * @param {string} method - El método HTTP (GET, POST, PUT, DELETE).
 * @param {object} [body=null] - El cuerpo de la solicitud para POST/PUT.
 * @param {boolean} [requiresAuth=true] - Si la solicitud requiere token de autenticación.
 * @param {boolean} [isFormData=false] - Si el cuerpo es FormData (para subida de archivos).
 * @returns {Promise<object>} La respuesta de la API en formato JSON.
 */
async function apiFetch(endpoint, method, body = null, requiresAuth = true, isFormData = false) {
    // Inicializar headers para todas las solicitudes
    const headers = {};

    // Añadir el token de autorización si se requiere y está disponible
    if (requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log(`[apiFetch] Sending Authorization header: Bearer ${authToken.substring(0, 20)}...`);
    } else if (requiresAuth && !authToken) {
        console.warn('[apiFetch] Attempted to make authenticated request but authToken is missing. User is not logged in or token expired.');
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        headers: headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : null),
    };

    console.log(`[apiFetch] Making ${method} request to: ${API_BASE_URL}${endpoint}`);
    if (body && !isFormData) {
        console.log('[apiFetch] Request body (JSON):', JSON.stringify(body, null, 2));
    } else if (isFormData) {
        console.log('[apiFetch] Request body (FormData - inspect below)');
        for (let pair of body.entries()) {
            console.log(`  FormData Field: ${pair[0]}, Value: ${pair[1]} (Type: ${typeof pair[1]})`);
        }
    }


    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.ok) {
        if (response.status === 204) {
            return {};
        }
        return response.json();
    } else {
        const errorData = await response.json();
        if (response.status === 401) {
            throw new Error(errorData.message || 'No autorizado: Token inválido o expirado.');
        }
        throw new Error(errorData.message || 'Error en la solicitud API');
    }
}

/**
 * Muestra un mensaje de alerta en la UI.
 * @param {HTMLElement} element - El elemento DOM donde se mostrará el mensaje.
 * @param {string} message - El mensaje a mostrar.
 * @param {'success'|'danger'} type - El tipo de alerta (para estilos CSS).
 * @param {number} duration - Duración en ms antes de ocultar el mensaje.
 */
function showAlert(element, message, type, duration = 3000) {
    element.textContent = message;
    element.className = `alert alert-${type}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, duration);
}

/**
 * Oculta todas las vistas y muestra la especificada.
 * @param {HTMLElement} viewToShow - La vista a mostrar.
 * @param {string} title - El título de la vista.
 */
function showView(viewToShow, title) {
    const views = [
        dashboardView, userManagementView, createUserView,
        docManagementView, createDocView, areasView, createAreaView
    ];
    views.forEach(view => {
        view.style.display = 'none';
    });
    viewToShow.style.display = 'block';
    viewTitle.textContent = title;

    // Actualizar clase activa del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active-menu');
    });
    const activeMenuItem = document.querySelector(`.menu-item[data-view="${viewToShow.id.replace('-view', '')}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active-menu');
        // Si es un submenú, expandir el padre
        if (activeMenuItem.closest('.submenu')) {
            activeMenuItem.closest('.has-submenu').classList.add('active');
        }
    }
}

// --- Authentication & Session Management ---

/**
 * Maneja el proceso de inicio de sesión.
 */
async function handleLogin() {
    const userName = usernameInput.value;
    const password = passwordInput.value;

    loginError.style.display = 'none';

    if (!userName || !password) {
        showAlert(loginError, 'Por favor, ingrese usuario y contraseña.', 'danger');
        return;
    }

    try {
        const data = await apiFetch('/auth/login', 'POST', { userName, password }, false);
        authToken = data.access_token;
        currentUser = data.user;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        initAppUI(); // Inicializar UI después de login
        showView(dashboardView, 'Dashboard');
    } catch (error) {
        console.error('Error de login:', error);
        showAlert(loginError, error.message || 'Credenciales inválidas.', 'danger');
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 */
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    loginScreen.style.display = 'flex';
    appContainer.style.display = 'none';
    document.body.classList.remove('logged-in');
    usernameInput.value = '';
    passwordInput.value = '';
    showAlert(loginError, 'Sesión cerrada exitosamente.', 'success');
}

/**
 * Inicializa la interfaz de usuario después de un login exitoso o una sesión existente.
 */
function initAppUI() {
    loginScreen.style.display = 'none';
    appContainer.style.display = 'block';
    document.body.classList.add('logged-in'); // Ajusta el layout CSS

    welcomeUser.textContent = `Bienvenido, ${currentUser.firstName} (${currentUser.userName})`;
    welcomeMessage.textContent = `Has iniciado sesión como ${currentUser.roles.join(', ')}.`;

    // Mostrar/ocultar menú de administración
    if (currentUser.roles.includes(ROLES.SUPER_ADMIN) || currentUser.roles.includes(ROLES.ADMIN)) {
        adminMenu.style.display = 'block';
    } else {
        adminMenu.style.display = 'none';
    }

    // Cargar estadísticas
    loadDashboardStats();
}

// --- Dashboard Functions ---

/**
 * Carga y muestra las estadísticas del dashboard.
 */
async function loadDashboardStats() {
    try {
        const users = await apiFetch('/users', 'GET');
        const documents = await apiFetch('/documents', 'GET');
        const areas = await apiFetch('/areas', 'GET');

        usersCount.textContent = users.length;
        docsCount.textContent = documents.length;
        areasCount.textContent = areas.length;

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        usersCount.textContent = 'Error';
        docsCount.textContent = 'Error';
        areasCount.textContent = 'Error';
    }
}


// --- User Management Functions ---

/**
 * Carga y muestra la tabla de usuarios.
 */
async function loadUsers() {
    usersLoading.style.display = 'block';
    usersTableBody.innerHTML = ''; // Limpiar tabla
    try {
        const users = await apiFetch('/users', 'GET');
        const filteredUsers = userSearch.value ?
            users.filter(user =>
                user.userName.toLowerCase().includes(userSearch.value.toLowerCase()) ||
                user.email.toLowerCase().includes(userSearch.value.toLowerCase()) ||
                user.firstName.toLowerCase().includes(userSearch.value.toLowerCase()) ||
                user.lastName.toLowerCase().includes(userSearch.value.toLowerCase())
            ) : users;

        filteredUsers.forEach(user => {
            const row = usersTableBody.insertRow();
            row.innerHTML = `
                <td>${user.userName}</td>
                <td>${user.email}</td>
                <td>${user.firstName}</td>
                <td>${user.lastName}</td>
                <td>${user.phone}</td>
                <td>${user.roles.join(', ')}</td>
                <td>${user.enable ? 'Activo' : 'Inactivo'} / ${user.blocked ? 'Bloqueado' : 'No Bloqueado'}</td>
                <td>
                    <button class="btn action-btn edit-btn" data-user-id="${user.id}">Editar</button>
                    <button class="btn action-btn delete-btn" data-user-id="${user.id}">Eliminar</button>
                </td>
            `;
            row.querySelector('.edit-btn').addEventListener('click', () => editUser(user.id));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteUser(user.id));
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showAlert(userMessage, error.message || 'Error al cargar usuarios.', 'danger');
    } finally {
        usersLoading.style.display = 'none';
    }
}

/**
 * Muestra el formulario para crear/editar un usuario.
 * @param {number|null} userId - ID del usuario a editar, o null para crear.
 */
async function showUserForm(userId = null) {
    showView(createUserView, userId ? 'Editar Usuario' : 'Crear Nuevo Usuario');
    createUserInputTitle.textContent = userId ? 'Editar Usuario' : 'Crear Nuevo Usuario';
    userFormMessage.style.display = 'none';
    resetUserForm(); // Limpiar formulario

    newPassword.style.display = 'block'; // Mostrar siempre en crear
    newPassword.previousElementSibling.style.display = 'block';
    userStatusGroup.style.display = 'none'; // Ocultar por defecto para crear

    await loadRolesIntoSelect(newRole);
    await loadCompaniesIntoSelect(newCompany); // Cargar compañías para el select de usuario

    if (userId) {
        saveUserBtn.dataset.userId = userId;
        newPassword.style.display = 'none'; // Ocultar contraseña en edición por defecto
        newPassword.previousElementSibling.style.display = 'none';
        userStatusGroup.style.display = 'flex'; // Mostrar estado en edición
        try {
            const user = await apiFetch(`/users/${userId}`, 'GET');
            newNickname.value = user.userName;
            newEmail.value = user.email;
            newFirstname.value = user.firstName;
            newLastname.value = user.lastName;
            newPhone.value = user.phone;
            newRole.value = user.roles[0] || ''; // Asume un rol principal
            newCompany.value = user.companyId; // Establecer la compañía del usuario
            editEnable.checked = user.enable;
            editBlocked.checked = user.blocked;
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            showAlert(userFormMessage, error.message || 'Error al cargar datos del usuario.', 'danger');
        }
    } else {
        delete saveUserBtn.dataset.userId;
    }
}

/**
 * Carga los roles disponibles en un elemento select.
 * @param {HTMLSelectElement} selectElement - El elemento select donde cargar los roles.
 */
async function loadRolesIntoSelect(selectElement) {
    try {
        const roles = await apiFetch('/roles', 'GET'); // Asumiendo un endpoint /roles
        selectElement.innerHTML = '<option value="">-- Seleccione un Rol --</option>'; // Añadir opción por defecto
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.name;
            option.textContent = role.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar roles:', error);
        showAlert(userFormMessage, error.message || 'Error al cargar roles.', 'danger');
    }
}

/**
 * Carga las compañías disponibles en un elemento select (reutilizada).
 * @param {HTMLSelectElement} selectElement - El elemento select donde cargar las compañías.
 */
async function loadCompaniesIntoSelect(selectElement) {
    try {
        const companies = await apiFetch('/companies', 'GET'); // Asumiendo un endpoint /companies
        selectElement.innerHTML = '<option value="">-- Seleccione una Compañía --</option>'; // Añadir opción por defecto
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar compañías:', error);
        // Usar userFormMessage ya que es el contexto del formulario de usuario
        showAlert(userFormMessage, error.message || 'Error al cargar compañías.', 'danger');
    }
}


/**
 * Maneja el guardado (creación o actualización) de un usuario.
 */
async function saveUser() {
    const userId = saveUserBtn.dataset.userId;
    const userData = {
        // Aplicar .trim() a los valores de los campos de texto
        userName: newNickname.value.trim(),
        email: newEmail.value.trim(),
        firstName: newFirstname.value.trim(),
        lastName: newLastname.value.trim(),
        phone: newPhone.value.trim(), // También para teléfono, aunque sea opcional
        roleName: newRole.value,
        companyId: parseInt(newCompany.value), // Asegúrate de que companyId sea un número
    };

    if (!userId) { // Creando nuevo usuario
        userData.password = newPassword.value.trim(); // Aplicar .trim() también a la contraseña
    } else { // Editando usuario existente
        if (newPassword.value.trim()) { // Si se proporciona una nueva contraseña al editar
            userData.password = newPassword.value.trim();
        }
        userData.enable = editEnable.checked;
        userData.blocked = editBlocked.checked;
    }

    // Validar campos obligatorios con mensajes específicos
    if (!userData.userName) {
        showAlert(userFormMessage, 'El campo "Nickname" es obligatorio.', 'danger');
        return;
    }
    if (!userData.email) {
        showAlert(userFormMessage, 'El campo "Correo Electrónico" es obligatorio.', 'danger');
        return;
    }
    // Validar formato de correo electrónico solo si el campo no está vacío
    if (userData.email && !validateEmail(userData.email)) {
        showAlert(userFormMessage, 'Por favor, ingrese un formato de correo electrónico válido.', 'danger');
        return;
    }
    if (!userData.firstName) {
        showAlert(userFormMessage, 'El campo "Nombres" es obligatorio.', 'danger');
        return;
    }
    if (!userData.lastName) {
        showAlert(userFormMessage, 'El campo "Apellidos" es obligatorio.', 'danger');
        return;
    }
    if (!userData.roleName) {
        showAlert(userFormMessage, 'Debe seleccionar un "Rol" para el usuario.', 'danger');
        return;
    }
    if (!userData.companyId || isNaN(userData.companyId)) { // isNaN para capturar si parseInt falla (ej. si el valor es "")
        showAlert(userFormMessage, 'Debe seleccionar una "Compañía" para el usuario.', 'danger');
        return;
    }
    if (!userId && !userData.password) {
        showAlert(userFormMessage, 'El campo "Contraseña" es obligatorio para nuevos usuarios.', 'danger');
        return;
    }
    
    try {
        if (userId) {
            await apiFetch(`/users/${userId}`, 'PUT', userData);
            showAlert(userMessage, 'Usuario actualizado exitosamente.', 'success');
        } else {
            await apiFetch('/users/register', 'POST', userData); // Asumiendo /users/register para creación
            showAlert(userMessage, 'Usuario creado exitosamente.', 'success');
        }
        showView(userManagementView, 'Gestión Usuarios');
        loadUsers();
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showAlert(userFormMessage, error.message || 'Error al guardar usuario.', 'danger');
    }
}

/**
 * Muestra el formulario para editar un usuario.
 * @param {number} userId - ID del usuario a editar.
 */
function editUser(userId) {
    showUserForm(userId);
}

/**
 * Elimina un usuario.
 * @param {number} userId - ID del usuario a eliminar.
 */
async function deleteUser(userId) {
    showConfirmModal('¿Está seguro de que desea eliminar este usuario?', async () => {
        try {
            await apiFetch(`/users/${userId}`, 'DELETE');
            showAlert(userMessage, 'Usuario eliminado exitosamente.', 'success');
            loadUsers();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            showAlert(userMessage, error.message || 'Error al eliminar usuario.', 'danger');
        } finally {
            hideConfirmModal();
        }
    });
}

/**
 * Resetea el formulario de usuario.
 */
function resetUserForm() {
    newNickname.value = '';
    newEmail.value = '';
    newPassword.value = '';
    newFirstname.value = '';
    newLastname.value = '';
    newPhone.value = '';
    newRole.value = ''; // O el valor por defecto si existe
    newCompany.value = ''; // Limpiar la selección de compañía
    editEnable.checked = true;
    editBlocked.checked = false;
    userFormMessage.style.display = 'none';
}


// --- Document Management Functions ---

let currentDocumentFile = null; // Para guardar el archivo seleccionado al editar

/**
 * Carga y muestra la tabla de documentos.
 * @param {number|null} companyId - ID de la compañía para filtrar.
 * @param {number|null} areaId - ID del área para filtrar.
 * @param {number|null} statusId - ID del estado para filtrar.
 */
async function loadDocuments(companyId = null, areaId = null, statusId = null) {
    docsLoading.style.display = 'block';
    docsTableBody.innerHTML = '';
    try {
        const documents = await apiFetch('/documents', 'GET'); // Endpoint corregido
        const filteredDocs = docSearch.value ?
            documents.filter(doc =>
                doc.name.toLowerCase().includes(docSearch.value.toLowerCase()) ||
                doc.description.toLowerCase().includes(docSearch.value.toLowerCase()) ||
                doc.company.name.toLowerCase().includes(docSearch.value.toLowerCase()) ||
                doc.area?.name.toLowerCase().includes(docSearch.value.toLowerCase()) ||
                doc.status.name.toLowerCase().includes(docSearch.value.toLowerCase()) ||
                doc.user.userName.toLowerCase().includes(docSearch.value.toLowerCase())
            ) : documents;

        filteredDocs.forEach(doc => {
            const row = docsTableBody.insertRow();
            const uploadDate = new Date(doc.createdDate).toLocaleDateString();
            row.innerHTML = `
                <td>${doc.name}</td>
                <td>${doc.company.name}</td>
                <td>${doc.area ? doc.area.name : 'N/A'}</td>
                <td>${doc.user.userName}</td>
                <td>${doc.status.name}</td>
                <td>${uploadDate}</td>
                <td>
                    <button class="btn action-btn view-btn" data-doc-id="${doc.id}">Ver</button>
                    <button class="btn action-btn edit-btn" data-doc-id="${doc.id}">Editar</button>
                    <button class="btn action-btn delete-btn" data-doc-id="${doc.id}">Eliminar</button>
                    <a href="${API_BASE_URL}/documents/${doc.id}/download" class="btn action-btn" style="background-color: #3498db; margin-left: 5px;" download>Descargar</a>
                </td>
            `;
            row.querySelector('.view-btn').addEventListener('click', () => openDocumentModal(doc.id));
            row.querySelector('.edit-btn').addEventListener('click', () => editDocument(doc.id));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteDocument(doc.id));
        });
    } catch (error) {
        console.error('Error al cargar documentos:', error);
        showAlert(docMessage, error.message || 'Error al cargar documentos.', 'danger');
    } finally {
        docsLoading.style.display = 'none';
    }
}

/**
 * Muestra el formulario para crear/editar un documento.
 * @param {number|null} docId - ID del documento a editar, o null para crear.
 */
async function showDocumentForm(docId = null) {
    showView(createDocView, docId ? 'Editar Documento' : 'Subir Nuevo Documento');
    createDocInputTitle.textContent = docId ? 'Editar Documento' : 'Subir Nuevo Documento';
    docFormMessage.style.display = 'none';
    resetDocumentForm(); // Limpiar formulario

    await loadCompaniesIntoSelect(docCompany);
    await loadDocumentStatusIntoSelect(docStatus);
    
    docCompany.addEventListener('change', () => loadAreasForCompany(docCompany.value));

    if (docId) {
        saveDocBtn.dataset.docId = docId;
        docFileGroup.style.display = 'none'; // Ocultar campo de archivo al editar
        docCurrentFileGroup.style.display = 'block'; // Mostrar archivo actual y botón de reemplazar
        
        try {
            const doc = await apiFetch(`/documents/${docId}`, 'GET'); // Endpoint corregido
            docName.value = doc.name;
            docCompany.value = doc.companyId;
            await loadAreasForCompany(doc.companyId); // Cargar áreas de la compañía seleccionada
            docArea.value = doc.areaId || ''; // Seleccionar área, si existe
            docStatus.value = doc.statusId;
            docDescription.value = doc.description;
            currentDocFilename.textContent = doc.fileName;
            currentDocFilename.href = `${API_BASE_URL}/uploads/${doc.fileName}`; // Asumiendo que los archivos se sirven desde /uploads

            currentDocumentFile = { name: doc.fileName, path: doc.filePath };

        } catch (error) {
            console.error('Error al cargar datos del documento:', error);
            showAlert(docFormMessage, error.message || 'Error al cargar datos del documento.', 'danger');
        }
    } else {
        delete saveDocBtn.dataset.docId;
        docFileGroup.style.display = 'block';
        docCurrentFileGroup.style.display = 'none';
        currentDocumentFile = null;
    }
}

/**
 * Carga los estados de documento disponibles en un elemento select.
 * @param {HTMLSelectElement} selectElement - El elemento select donde cargar los estados.
 */
async function loadDocumentStatusIntoSelect(selectElement) {
    try {
        const statuses = await apiFetch('/document-statuses', 'GET'); // Asumiendo un endpoint /document-statuses
        selectElement.innerHTML = '<option value="">-- Seleccione un Estado --</option>';
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar estados de documento:', error);
        showAlert(docFormMessage, error.message || 'Error al cargar estados de documento.', 'danger');
    }
}

/**
 * Carga las áreas para una compañía específica en un elemento select.
 * @param {number} companyId - ID de la compañía para filtrar áreas.
 */
async function loadAreasForCompany(companyId) {
    docArea.innerHTML = '<option value="">-- Seleccione un Área (Opcional) --</option>';
    if (!companyId) return;

    try {
        const areas = await apiFetch(`/areas?companyId=${companyId}`, 'GET');
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.name;
            docArea.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar áreas para la compañía:', error);
        showAlert(docFormMessage, error.message || 'Error al cargar áreas.', 'danger');
    }
}


/**
 * Maneja el guardado (creación o actualización) de un documento.
 */
async function saveDocument() {
    const docId = saveDocBtn.dataset.docId;
    const companyIdValue = docCompany.value;
    const areaIdValue = docArea.value;
    const statusIdValue = docStatus.value;

    const companyId = parseInt(companyIdValue);
    const areaId = areaIdValue ? parseInt(areaIdValue) : null; 
    const name = docName.value.trim();
    const description = docDescription.value.trim();
    const statusId = parseInt(statusIdValue);
    const file = docFile.files[0];

    // Validación frontend para campos obligatorios y numéricos
    if (!name) {
        showAlert(docFormMessage, 'El campo "Nombre del Documento" es obligatorio.', 'danger');
        return;
    }
    if (!companyIdValue || isNaN(companyId)) {
        showAlert(docFormMessage, 'Debe seleccionar una "Compañía" válida.', 'danger');
        return;
    }
    if (!statusIdValue || isNaN(statusId)) {
        showAlert(docFormMessage, 'Debe seleccionar un "Estado" válido.', 'danger');
        return;
    }
    if (areaIdValue && isNaN(areaId)) {
        showAlert(docFormMessage, 'El ID del área seleccionado no es un número válido.', 'danger');
        return;
    }
    if (!docId && !file) {
        showAlert(docFormMessage, 'El campo "Archivo" es obligatorio para nuevos documentos.', 'danger');
        return;
    }

    const formData = new FormData();
    
    formData.append('companyId', companyId.toString()); 
    if (areaId !== null) {
        formData.append('areaId', areaId.toString());
    }
    formData.append('name', name);
    if (description) formData.append('description', description);
    formData.append('statusId', statusId.toString()); 
    
    let method = 'POST';
    let endpoint = '/documents'; 

    if (docId) { // Editar documento
        method = 'PUT';
        endpoint = `/documents/${docId}`; 
        if (file) {
            formData.append('file', file);
        } 
    } else { // Crear nuevo documento
        if (file) {
            formData.append('file', file);
        }
    }

    try {
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
 * Muestra el formulario para editar un documento.
 * @param {number} docId - ID del documento a editar.
 */
function editDocument(docId) {
    showDocumentForm(docId);
}

/**
 * Elimina un documento.
 * @param {number} docId - ID del documento a eliminar.
 */
async function deleteDocument(docId) {
    showConfirmModal('¿Está seguro de que desea eliminar este documento? Esto también eliminará el archivo asociado.', async () => {
        try {
            await apiFetch(`/documents/${docId}`, 'DELETE');
            showAlert(docMessage, 'Documento eliminado exitosamente.', 'success');
            loadDocuments();
        } catch (error) {
            console.error('Error al eliminar documento:', error);
            showAlert(docMessage, error.message || 'Error al eliminar documento.', 'danger');
        } finally {
            hideConfirmModal();
        }
    });
}

/**
 * Resetea el formulario de documento.
 */
function resetDocumentForm() {
    docName.value = '';
    docCompany.value = '';
    docArea.innerHTML = '<option value="">-- Seleccione un Área (Opcional) --</option>';
    docStatus.value = '';
    docDescription.value = '';
    docFile.value = ''; // Limpiar el input de archivo
    docFormMessage.style.display = 'none';
    docFileGroup.style.display = 'block';
    docCurrentFileGroup.style.display = 'none';
    currentDocumentFile = null;
}

/**
 * Cambia para permitir la selección de un nuevo archivo al editar.
 */
function replaceDocumentFile() {
    docFileGroup.style.display = 'block';
    docCurrentFileGroup.style.display = 'none';
}

/**
 * Abre el modal para visualizar un documento.
 * @param {number} docId - ID del documento a visualizar.
 */
async function openDocumentModal(docId) {
    try {
        const doc = await apiFetch(`/documents/${docId}`, 'GET');
        modalDocTitle.textContent = doc.name;
        
        // Construir la URL completa para el archivo
        const fileUrl = `${API_BASE_URL}/uploads/${doc.fileName}`;
        
        // Establecer la URL del iframe para visualizar el documento
        docViewerIframe.src = fileUrl;
        
        // Establecer la URL para el botón de descarga
        downloadDocBtn.href = fileUrl;
        downloadDocBtn.download = doc.fileName; // Sugiere el nombre del archivo al descargar

        documentViewerModal.style.display = 'flex'; // Mostrar el modal
    } catch (error) {
        console.error('Error al abrir el documento:', error);
        showAlert(docMessage, error.message || 'Error al cargar el documento para visualización.', 'danger');
    }
}

/**
 * Cierra el modal de visualización de documento.
 */
function closeDocumentModal() {
    documentViewerModal.style.display = 'none';
    docViewerIframe.src = ''; // Limpiar el src del iframe para detener la carga
    modalDocTitle.textContent = 'Visualizar Documento'; // Restablecer título
}


// --- Area Management Functions ---

/**
 * Carga y muestra la tabla de áreas.
 */
async function loadAreas() {
    areasLoading.style.display = 'block';
    areasTableBody.innerHTML = '';
    try {
        const areas = await apiFetch('/areas', 'GET');
        const filteredAreas = areaSearch.value ?
            areas.filter(area =>
                area.name.toLowerCase().includes(areaSearch.value.toLowerCase()) ||
                area.description.toLowerCase().includes(areaSearch.value.toLowerCase()) ||
                area.company.name.toLowerCase().includes(areaSearch.value.toLowerCase())
            ) : areas;

        filteredAreas.forEach(area => {
            const row = areasTableBody.insertRow();
            const createdDate = new Date(area.createdDate).toLocaleDateString();
            row.innerHTML = `
                <td>${area.name}</td>
                <td>${area.description || 'N/A'}</td>
                <td>${area.company.name}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn action-btn edit-btn" data-area-id="${area.id}">Editar</button>
                    <button class="btn action-btn delete-btn" data-area-id="${area.id}">Eliminar</button>
                </td>
            `;
            row.querySelector('.edit-btn').addEventListener('click', () => editArea(area.id));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteArea(area.id));
        });
    } catch (error) {
        console.error('Error al cargar áreas:', error);
        showAlert(areaMessage, error.message || 'Error al cargar áreas.', 'danger');
    } finally {
        areasLoading.style.display = 'none';
    }
}

/**
 * Muestra el formulario para crear/editar un área.
 * @param {number|null} areaId - ID del área a editar, o null para crear.
 */
async function showAreaForm(areaId = null) {
    showView(createAreaView, areaId ? 'Editar Área' : 'Crear Nueva Área');
    createAreaInputTitle.textContent = areaId ? 'Editar Área' : 'Crear Nueva Área';
    areaFormMessage.style.display = 'none';
    resetAreaForm(); // Limpiar formulario

    await loadCompaniesIntoSelect(areaCompany); // Cargar compañías para el select de área

    if (areaId) {
        saveAreaBtn.dataset.areaId = areaId;
        try {
            const area = await apiFetch(`/areas/${areaId}`, 'GET');
            areaName.value = area.name;
            areaDescription.value = area.description;
            areaCompany.value = area.companyId;
        }
        catch (error) {
            console.error('Error al cargar datos del área:', error);
            showAlert(areaFormMessage, error.message || 'Error al cargar datos del área.', 'danger');
        }
    } else {
        delete saveAreaBtn.dataset.areaId;
    }
}

/**
 * Maneja el guardado (creación o actualización) de un área.
 */
async function saveArea() {
    const areaId = saveAreaBtn.dataset.areaId;
    const areaData = {
        name: areaName.value,
        description: areaDescription.value,
        companyId: parseInt(areaCompany.value) // Asegúrate de que companyId sea un número
    };

    if (!areaData.name || !areaData.companyId) {
        showAlert(areaFormMessage, 'El nombre del área y la compañía son obligatorios.', 'danger');
        return;
    }

    try {
        if (areaId) {
            await apiFetch(`/areas/${areaId}`, 'PUT', areaData);
            showAlert(areaMessage, 'Área actualizada exitosamente.', 'success');
        } else {
            await apiFetch('/areas', 'POST', areaData);
            showAlert(areaMessage, 'Área creada exitosamente.', 'success');
        }
        showView(areasView, 'Áreas');
        loadAreas();
    } catch (error) {
        console.error('Error al guardar área:', error);
        showAlert(areaFormMessage, error.message || 'Error al guardar área.', 'danger');
    }
}

/**
 * Muestra el formulario para editar un área.
 * @param {number} areaId - ID del área a editar.
 */
function editArea(areaId) {
    showAreaForm(areaId);
}

/**
 * Elimina un área.
 * @param {number} areaId - ID del área a eliminar.
 */
async function deleteArea(areaId) {
    showConfirmModal('¿Está seguro de que desea eliminar esta área?', async () => {
        try {
            await apiFetch(`/areas/${areaId}`, 'DELETE');
            showAlert(areaMessage, 'Área eliminada exitosamente.', 'success');
            loadAreas();
        } catch (error) {
            console.error('Error al eliminar área:', error);
            showAlert(areaMessage, error.message || 'Error al eliminar área.', 'danger');
        } finally {
            hideConfirmModal();
        }
    });
}

/**
 * Resetea el formulario de área.
 */
function resetAreaForm() {
    areaName.value = '';
    areaDescription.value = '';
    areaCompany.value = ''; // Resetear la selección de compañía
    areaFormMessage.style.display = 'none';
}

// --- Validation Functions ---

/**
 * Valida el formato de correo electrónico.
 * @param {string} email - Correo electrónico a validar.
 * @returns {boolean} True si el formato es válido, false en caso contrario.
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    return re.test(email);
}

// --- Event Listeners ---
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// Custom Confirmation Modal Listeners
confirmYesBtn.addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback(true);
    }
});
confirmNoBtn.addEventListener('click', () => {
    hideConfirmModal();
});


// Sidebar navigation
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (event) => {
        const view = item.dataset.view;
        if (view) {
            // Ocultar submenús activos al cambiar de vista principal
            document.querySelectorAll('.has-submenu.active').forEach(submenuParent => {
                if (submenuParent !== item.closest('.has-submenu')) {
                    submenuParent.classList.remove('active');
                }
            });
            
            switch (view) {
                case 'dashboard':
                    showView(dashboardView, 'Dashboard');
                    loadDashboardStats();
                    break;
                case 'user-management':
                    showView(userManagementView, 'Gestión Usuarios');
                    loadUsers();
                    break;
                case 'doc-management':
                    showView(docManagementView, 'Gestión Documental');
                    loadDocuments();
                    break;
                case 'areas':
                    showView(areasView, 'Áreas');
                    loadAreas();
                    break;
            }
        } else if (item.classList.contains('has-submenu')) {
            item.classList.toggle('active');
        }
    });
});

// User Management Listeners
createUserBtn.addEventListener('click', () => showUserForm());
saveUserBtn.addEventListener('click', saveUser);
cancelUserBtn.addEventListener('click', () => { showView(userManagementView, 'Gestión Usuarios'); loadUsers(); });
userSearch.addEventListener('input', loadUsers); // Filtrar al escribir

// Document Management Listeners
createDocBtn.addEventListener('click', () => showDocumentForm());
saveDocBtn.addEventListener('click', saveDocument);
cancelDocBtn.addEventListener('click', () => { showView(docManagementView, 'Gestión Documental'); loadDocuments(); });
docSearch.addEventListener('input', loadDocuments);
replaceDocFileBtn.addEventListener('click', replaceDocumentFile); // Botón para reemplazar archivo

// Document Viewer Modal Listeners
closeDocModal.addEventListener('click', closeDocumentModal);
closeDocModalBtn.addEventListener('click', closeDocumentModal);


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

document.addEventListener('DOMContentLoaded', initApp);
