// Supabase Configuration
const SUPABASE_URL = 'https://humjrhsljrntqsifvjve.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zIelwsJFBxMxtara1zTP6Q_VUP49k1-';

let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Supabase initialization failed:", e);
}

const form = document.getElementById('login-form');
const passwordInput = document.getElementById('admin-password');
const loginBtn = document.getElementById('login-btn');
const errorMsg = document.getElementById('error-msg');
const toggleBtn = document.getElementById('toggle-pw');
const iconEye = document.getElementById('icon-eye');
const iconEyeSlash = document.getElementById('icon-eye-slash');

if (sessionStorage.getItem('sarsa_admin_auth') === 'true') {
    window.location.replace('../');
}


toggleBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    iconEye.style.display = isHidden ? 'none' : '';
    iconEyeSlash.style.display = isHidden ? '' : 'none';
    passwordInput.focus();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const entered = passwordInput.value;

    loginBtn.classList.add('loading');
    errorMsg.classList.remove('visible');
    passwordInput.classList.remove('error');

    try {
        if (!supabaseClient) {
            throw new Error("Supabase not initialized");
        }

        // CALL THE SERVER-SIDE VERIFICATION FUNCTION
        const { data, error } = await supabaseClient.rpc('verify_admin', { 
            p_password: entered 
        });

        if (error) {
            console.error("Auth error:", error);
            throw error;
        }

        if (data && data.success) {
            // Store Auth State and the Secret Key
            sessionStorage.setItem('sarsa_admin_auth', 'true');
            sessionStorage.setItem('sarsa_admin_key', data.admin_key);
            
            window.location.href = '../';
        } else {
            loginBtn.classList.remove('loading');
            passwordInput.classList.add('error');
            passwordInput.value = '';
            errorMsg.classList.add('visible');
            passwordInput.focus();
        }
    } catch (err) {
        loginBtn.classList.remove('loading');
        console.error("Detailed Login Error:", err);
        alert(`Connection Error: ${err.message || 'Check your internet or SQL setup'}`);
    }
});

passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('error');
    errorMsg.classList.remove('visible');
});
