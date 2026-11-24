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
            hideAlert();
        });

        tabRegister.addEventListener('click', function () {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.classList.add('active');
            formLogin.classList.remove('active');
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

    // 3. Manejo del Login
    if (formLogin) {
        formLogin.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showAlert('Por favor completa todos los campos requeridos.', 'error');
                return;
            }

            const users = getUsers();
            let foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

            // Si no está en usuarios locales, intentar autenticar con Supabase
            if (!foundUser && typeof getSupabaseClient === 'function') {
                const client = getSupabaseClient();
                if (client && client.auth) {
                    try {
                        const { data, error } = await client.auth.signInWithPassword({ email, password });
                        if (!error && data && data.user) {
                            const meta = data.user.user_metadata || {};
                            foundUser = {
                                id: data.user.id,
                                name: meta.name || data.user.email.split('@')[0],
                                email: data.user.email,
                                role: meta.role || 'conductor',
                                city: meta.city || 'Valledupar',
                                phone: meta.phone || ''
                            };
                            // Guardar en copia local
                            users.push(foundUser);
                            localStorage.setItem('renteasy_users', JSON.stringify(users));
                        }
                    } catch (err) {
                        console.warn("Fallo login Supabase:", err);
                    }
                }
            }

            if (foundUser) {
                // Iniciar sesión en Supabase en segundo plano si es posible
                if (typeof getSupabaseClient === 'function') {
                    const client = getSupabaseClient();
                    if (client && client.auth) {
                        client.auth.signInWithPassword({ email, password }).catch(() => {});
                    }
                }

                // Guardar sesión activa
                const sessionData = {
                    id: foundUser.id,
                    name: foundUser.name,
                    email: foundUser.email,
                    role: foundUser.role,
                    city: foundUser.city || '',
                    phone: foundUser.phone || '',
                    loggedAt: new Date().toISOString()
                };
                localStorage.setItem('renteasy_current_user', JSON.stringify(sessionData));

                showAlert(`¡Bienvenido de nuevo, ${foundUser.name}! Redirigiendo a tu panel...`, 'success');

                setTimeout(() => {
                    if (foundUser.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (foundUser.role === 'propietario') {
                        window.location.href = 'dashboard-propietario.html';
                    } else {
                        window.location.href = 'car.html';
                    }
                }, 1000);
            } else {
                showAlert('Correo electrónico o contraseña incorrectos. Verifica tus datos o crea una cuenta.', 'error');
            }
        });
    }

    // 4. Manejo del Registro
    if (formRegister) {
        formRegister.addEventListener('submit', function (e) {
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
                    if (client.auth) {
                        client.auth.signUp({
                            email: email,
                            password: password,
                            options: {
                                data: { name: name, phone: phone, role: role, city: city, avatar_url: userAvatar }
                            }
                        }).catch(e => console.warn("Supabase signUp:", e));
                    }
                    client.from('perfiles').insert([{
                        email: email,
                        nombre_completo: name,
                        telefono: phone,
                        rol: role,
                        ciudad: city,
                        avatar_url: userAvatar
                    }]).catch(e => console.warn("Supabase insert perfil:", e));
                }
            }

            // Iniciar sesión automáticamente
            localStorage.setItem('renteasy_current_user', JSON.stringify({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                city: newUser.city,
                phone: newUser.phone,
                avatar: newUser.avatar,
                city: newUser.city,
                phone: newUser.phone,
                appliedCoupon: newUser.appliedCoupon,
                discountPercent: newUser.discountPercent,
                loggedAt: new Date().toISOString()
            }));

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
        
        // Si no existen usuarios, creamos los 3 perfiles demo
        if (users.length === 0) {
            users = [
                {
                    id: 'usr_admin',
                    name: 'Administrador Principal',
                    email: 'admin@rentcarcolombia.com',
                    phone: '+57 316 235 7871',
                    role: 'admin',
                    city: 'Valledupar',
                    password: 'admin'
                },
                {
                    id: 'usr_demo_host',
                    name: 'Carlos Mendoza (Propietario Demo)',
                    email: 'propietario@ejemplo.com',
                    phone: '+57 300 123 4567',
                    role: 'propietario',
                    city: 'Valledupar',
                    password: '123456'
                },
                {
                    id: 'usr_demo_client',
                    name: 'Laura Gómez (Conductora Demo)',
                    email: 'conductor@ejemplo.com',
                    phone: '+57 311 987 6543',
                    role: 'conductor',
                    city: 'Bogotá',
                    password: '123456'
                }
            ];
            localStorage.setItem('renteasy_users', JSON.stringify(users));
        } else if (!users.some(u => u.role === 'admin')) {
            // Asegurar que la cuenta de admin siempre exista
            users.unshift({
                id: 'usr_admin',
                name: 'Administrador Principal',
                email: 'admin@rentcarcolombia.com',
                phone: '+57 316 235 7871',
                role: 'admin',
                city: 'Valledupar',
                password: 'admin'
            });
            localStorage.setItem('renteasy_users', JSON.stringify(users));
        }
    }
});
