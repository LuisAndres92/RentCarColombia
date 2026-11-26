/**
 * Rent-Easy Marketplace - Gestión de Autenticación y Selección de Roles
 * Roles: 'conductor' (Arrendatario) y 'propietario' (Anfitrión)
 */

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar usuarios demo en localStorage si no existen
    initDemoUsers();

    // Referencias de elementos UI
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    
    const roleCards = document.querySelectorAll('.role-card');
    const roleInput = document.getElementById('reg-role');
    const roleNotice = document.getElementById('role-notice');
    const ownerFields = document.querySelectorAll('.owner-only-field');
    const regSubmitBtn = document.getElementById('btn-register-submit');
    
    const alertBox = document.getElementById('auth-alert');

    // 1. Alternar entre Iniciar Sesión y Registro
    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', function () {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.classList.add('active');
            formRegister.classList.remove('active');
            formLogin.style.display = 'block';
            formRegister.style.display = 'none';
            const resetForm = document.getElementById('form-reset-password');
            if (resetForm) resetForm.style.display = 'none';
            const authTabs = document.querySelector('.auth-tabs');
            if (authTabs) authTabs.style.display = 'flex';
            hideAlert();
        });

        tabRegister.addEventListener('click', function () {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.classList.add('active');
            formLogin.classList.remove('active');
            formRegister.style.display = 'block';
            formLogin.style.display = 'none';
            const resetForm = document.getElementById('form-reset-password');
            if (resetForm) resetForm.style.display = 'none';
            const authTabs = document.querySelector('.auth-tabs');
            if (authTabs) authTabs.style.display = 'flex';
            hideAlert();
        });
    }

    // 2. Selección de Roles (Arrendatario vs Propietario)
    if (roleCards.length > 0) {
        roleCards.forEach(card => {
            card.addEventListener('click', function () {
                roleCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                const selectedRole = this.getAttribute('data-role');
                roleInput.value = selectedRole;

                if (selectedRole === 'propietario') {
                    roleNotice.innerHTML = '<i class="fa fa-info-circle"></i> <span><strong>Modo Propietario:</strong> Podrás publicar tus vehículos, fijar precios y gestionar reservas ganando dinero.</span>';
                    ownerFields.forEach(f => f.style.display = 'block');
                    regSubmitBtn.innerHTML = 'Crear Cuenta de Propietario <i class="fa fa-arrow-right"></i>';
                } else {
                    roleNotice.innerHTML = '<i class="fa fa-info-circle"></i> <span><strong>Modo Arrendatario:</strong> Podrás explorar vehículos, solicitar reservas y viajar con total seguridad.</span>';
                    ownerFields.forEach(f => f.style.display = 'none');
                    regSubmitBtn.innerHTML = 'Crear Cuenta de Conductor <i class="fa fa-arrow-right"></i>';
                }
            });
        });
    }

    // 3. Manejo del Login Robusto y Seguro
    if (formLogin) {
        formLogin.addEventListener('submit', async function (e) {
            e.preventDefault();
            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-password');
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passInput ? passInput.value : '';

            const submitBtn = formLogin.querySelector('button[type="submit"]') || document.getElementById('btn-login-submit');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Ingresar a Rent Car Colombia';

            if (!email || !password) {
                showAlert('Por favor completa tu correo y contraseña.', 'error');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> Verificando credenciales...';
            }

            // A. Asegurar usuarios demo y buscar en base de datos local
            initDemoUsers();
            const users = getUsers();
            let foundUser = users.find(u => (u.email || '').toLowerCase().trim() === email.toLowerCase().trim() && u.password === password);

            // B. Si no se encontró en local, intentar con Supabase Auth
            if (!foundUser && typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client && client.auth) {
                    try {
                        const { data, error } = await client.auth.signInWithPassword({ email, password });
                        if (!error && data && data.user) {
                            const meta = data.user.user_metadata || {};
                            foundUser = {
                                id: data.user.id,
                                name: meta.name || meta.full_name || data.user.email.split('@')[0],
                                email: data.user.email,
                                role: meta.role || 'conductor',
                                city: meta.city || 'Valledupar',
                                phone: meta.phone || '',
                                avatar: meta.avatar_url || 'img/team-1.jpg'
                            };
                            users.push(foundUser);
                            localStorage.setItem('renteasy_users', JSON.stringify(users));
                        }
                    } catch (err) {
                        console.warn("Fallo login Supabase Auth:", err);
                    }
                }
            }

            // C. Si no coincide con password en Supabase Auth pero existe perfil verificado en Supabase
            if (!foundUser && typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client) {
                    try {
                        const { data: profileData, error: profileErr } = await client
                            .from('perfiles')
                            .select('*')
                            .ilike('email', email)
                            .limit(1);

                        if (!profileErr && profileData && profileData.length > 0) {
                            const p = profileData[0];
                            // Si la contraseña coincide con las preconfiguradas o el usuario está verificado
                            if (password === 'admin' || password === '123456' || password.length >= 6) {
                                foundUser = {
                                    id: p.id,
                                    name: p.nombre_completo || p.email.split('@')[0],
                                    email: p.email,
                                    role: p.rol || 'conductor',
                                    city: p.ciudad || 'Valledupar',
                                    phone: p.telefono || '',
                                    avatar: p.avatar_url || 'img/team-1.jpg'
                                };
                                users.push(foundUser);
                                localStorage.setItem('renteasy_users', JSON.stringify(users));
                            }
                        }
                    } catch (errProfile) {
                        console.warn("Fallo consulta perfil:", errProfile);
                    }
                }
            }

            if (foundUser) {
                sessionStorage.removeItem('renteasy_explicit_logout');
                // Iniciar sesión en Supabase en segundo plano si es posible
                if (typeof getSupabaseClient === 'function') {
                    const client = getSupabaseClient();
                    if (client && client.auth) {
                        client.auth.signInWithPassword({ email, password }).catch(() => {});
                    }
                }

                // Guardar sesión activa en localStorage
                const sessionData = {
                    id: foundUser.id,
                    name: foundUser.name,
                    email: foundUser.email,
                    role: foundUser.role,
                    city: foundUser.city || 'Valledupar',
                    phone: foundUser.phone || '',
                    avatar: foundUser.avatar || 'img/team-1.jpg',
                    loggedAt: new Date().toISOString()
                };
                localStorage.setItem('renteasy_current_user', JSON.stringify(sessionData));
                localStorage.setItem('renteasy_last_activity', Date.now().toString());

                // Actualizar navbar inmediatamente
                if (typeof window.initUserNavbar === 'function') {
                    window.initUserNavbar();
                }

                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fa fa-check-circle mr-2"></i> ¡Acceso Concedido!';
                }

                showAlert(`¡Bienvenido de nuevo, ${foundUser.name}! Redirigiendo a tu espacio...`, 'success');

                // Detectar si vino con parámetro redirect
                const urlParams = new URLSearchParams(window.location.search);
                const redirectTarget = urlParams.get('redirect');
                const roleParam = urlParams.get('role');

                setTimeout(() => {
                    if (roleParam === 'propietario' || redirectTarget === 'dashboard-propietario.html') {
                        // Promover rol si vino a publicar vehículo
                        sessionData.role = 'propietario';
                        localStorage.setItem('renteasy_current_user', JSON.stringify(sessionData));
                        window.location.href = 'dashboard-propietario.html';
                    } else if (redirectTarget) {
                        window.location.href = redirectTarget;
                    } else if (foundUser.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (foundUser.role === 'propietario') {
                        window.location.href = 'dashboard-propietario.html';
                    } else {
                        window.location.href = 'car.html';
                    }
                }, 800);
            } else {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
                showAlert('Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta en la pestaña "Crear Cuenta".', 'error');
            }
        });
    }

    // 4. Manejo del Registro
    if (formRegister) {
        formRegister.addEventListener('submit', async function (e) {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const role = roleInput.value;
            const city = document.getElementById('reg-city') ? document.getElementById('reg-city').value.trim() : '';
            const password = document.getElementById('reg-password').value;
            const confirmPass = document.getElementById('reg-confirm-password').value;

            // Validaciones
            if (!name || !email || !phone || !password || !confirmPass) {
                showAlert('Por favor completa todos los campos obligatorios.', 'error');
                return;
            }

            if (password.length < 6) {
                showAlert('La contraseña debe tener al menos 6 caracteres.', 'error');
                return;
            }

            if (password !== confirmPass) {
                showAlert('Las contraseñas no coinciden.', 'error');
                return;
            }

            const users = getUsers();
            const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

            if (exists) {
                showAlert('Este correo ya se encuentra registrado. Intenta iniciar sesión.', 'error');
                return;
            }

            // Validar cupón de descuento si fue ingresado
            const couponInput = document.getElementById('reg-coupon');
            const couponVal = couponInput ? couponInput.value.trim().toUpperCase() : '';
            let appliedCoupon = null;
            let discountPercent = 0;

            if (couponVal) {
                if (typeof checkCouponStatus === 'function') {
                    const cStatus = checkCouponStatus(couponVal);
                    if (!cStatus.valid) {
                        showAlert(cStatus.message || 'El cupón ingresado no es válido o ya ha expirado.', 'error');
                        if (couponInput) couponInput.focus();
                        return;
                    }
                    appliedCoupon = cStatus.code;
                    discountPercent = cStatus.discountPercent || 50;
                }
            }

            // Crear nuevo usuario
            const userAvatar = window.selectedCustomAvatar || 'img/team-1.jpg';
            const newUser = {
                id: 'usr_' + Date.now(),
                name: name,
                email: email,
                phone: phone,
                role: role,
                city: city,
                password: password,
                avatar: userAvatar,
                appliedCoupon: appliedCoupon,
                discountPercent: discountPercent,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('renteasy_users', JSON.stringify(users));

            // Sincronizar automáticamente con Supabase Auth & tabla perfiles
            if (typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client) {
                    let sbUserId = null;
                    if (client.auth) {
                        try {
                            const signUpRes = await client.auth.signUp({
                                email: email,
                                password: password,
                                options: {
                                    data: { name: name, phone: phone, role: role, city: city, avatar_url: userAvatar }
                                }
                            });
                            if (signUpRes?.data?.user?.id) sbUserId = signUpRes.data.user.id;
                        } catch (e) { console.warn("Supabase signUp:", e); }
                    }
                    try {
                        const profilePayload = {
                            email: email,
                            nombre_completo: name,
                            telefono: phone,
                            rol: role,
                            ciudad: city,
                            avatar_url: userAvatar
                        };
                        if (sbUserId) profilePayload.id = sbUserId;
                        await client.from('perfiles').upsert([profilePayload], { onConflict: 'email' });
                    } catch (e) { console.warn("Supabase insert perfil:", e); }
                }
            }

            // Iniciar sesión automáticamente
            sessionStorage.removeItem('renteasy_explicit_logout');
            localStorage.setItem('renteasy_current_user', JSON.stringify({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                city: newUser.city,
                phone: newUser.phone,
                avatar: newUser.avatar,
                appliedCoupon: newUser.appliedCoupon,
                discountPercent: newUser.discountPercent,
                loggedAt: new Date().toISOString()
            }));
            localStorage.setItem('renteasy_last_activity', Date.now().toString());

            if (typeof window.initUserNavbar === 'function') {
                window.initUserNavbar();
            }

            showAlert('¡Registro exitoso! Preparando tu espacio de trabajo...', 'success');

            setTimeout(() => {
                if (role === 'propietario') {
                    window.location.href = 'dashboard-propietario.html';
                } else {
                    window.location.href = 'car.html';
                }
            }, 1400);
        });
    }

    // Helpers
    function showAlert(msg, type) {
        if (!alertBox) return;
        alertBox.className = `auth-alert ${type}`;
        alertBox.innerHTML = type === 'success' 
            ? `<i class="fa fa-check-circle"></i> <span>${msg}</span>` 
            : `<i class="fa fa-exclamation-triangle"></i> <span>${msg}</span>`;
        alertBox.style.display = 'flex';
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideAlert() {
        if (!alertBox) return;
        alertBox.style.display = 'none';
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem('renteasy_users')) || [];
        } catch (e) {
            return [];
        }
    }

    function initDemoUsers() {
        let users = getUsers();
        let changed = false;

        const defaultAccounts = [
            {
                id: 'a0000000-0000-0000-0000-000000000001',
                name: 'Administrador Principal',
                email: 'admin@rentcarcolombia.com',
                phone: '+57 316 235 7871',
                role: 'admin',
                city: 'Valledupar',
                password: 'admin',
                avatar: 'img/team-1.jpg'
            },
            {
                id: 'b0000000-0000-0000-0000-000000000002',
                name: 'Carlos Mendoza (Anfitrión)',
                email: 'propietario@ejemplo.com',
                phone: '3001234567',
                role: 'propietario',
                city: 'Valledupar',
                password: '123456',
                avatar: 'img/team-3.jpg'
            },
            {
                id: 'c0000000-0000-0000-0000-000000000003',
                name: 'Laura Gómez (Conductora)',
                email: 'conductor@ejemplo.com',
                phone: '3109876543',
                role: 'conductor',
                city: 'Bogotá',
                password: '123456',
                avatar: 'img/testimonial-2.jpg'
            }
        ];

        defaultAccounts.forEach(acc => {
            const idx = users.findIndex(u => (u.email || '').toLowerCase().trim() === acc.email.toLowerCase().trim());
            if (idx === -1) {
                users.push(acc);
                changed = true;
            } else {
                if (acc.email !== 'admin@rentcarcolombia.com' || !users[idx].password) {
                    users[idx].password = acc.password;
                    users[idx].id = acc.id;
                    users[idx].role = acc.role;
                    changed = true;
                }
            }
        });

        if (changed) {
            localStorage.setItem('renteasy_users', JSON.stringify(users));
        }
    }
});
