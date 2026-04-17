const SUPABASE_URL = 'https://humjrhsljrntqsifvjve.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zIelwsJFBxMxtara1zTP6Q_VUP49k1-';

let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_URL.startsWith('http')) {
        // GET THE SECRET KEY FROM SESSION
        const adminKey = sessionStorage.getItem('sarsa_admin_key') || '';

        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    'x-admin-secret': adminKey
                }
            }
        });
    }
} catch (e) {
    console.error('Supabase initialization failed:', e);
}


document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('orders-container');
    const pendingCount = document.getElementById('pending-count');
    const totalVolume = document.getElementById('total-revenue');
    const statusIndicator = document.getElementById('connection-status');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const ordersBody = document.getElementById('orders-body');
    const dateSelect = document.getElementById('date-select');
    const clearDateBtn = document.getElementById('clear-date');

    const adminModal = document.getElementById('admin-modal');
    const modalTitleEl = document.getElementById('modal-title');
    const modalMessageEl = document.getElementById('modal-message');

    const showModal = ({ title, message, confirmText = 'Confirm', isDanger = false, onConfirm, onCancel }) => {
        modalTitleEl.textContent = title;
        modalMessageEl.textContent = message;

        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        confirmBtn.textContent = confirmText;
        confirmBtn.className = 'modal-btn modal-btn-confirm' + (isDanger ? ' danger' : '');

       
        adminModal.classList.remove('hidden');

        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        confirmBtn.replaceWith(newConfirm);
        cancelBtn.replaceWith(newCancel);

        const hide = () => adminModal.classList.add('hidden');

        newConfirm.addEventListener('click', () => {
            hide();
            if (onConfirm) onConfirm();
        });

        newCancel.addEventListener('click', () => {
            hide();
            if (onCancel) onCancel();
        });
    };

    let currentStatusFilter = 'pending';
    let allOrders = [];
    let selectedDate = null;

    const init = async () => {
        if (!supabaseClient) {
            ordersBody.innerHTML = `<tr><td colspan="8" class="loading-msg">Fetching the reserve...</td></tr>`;
            statusIndicator.textContent = 'Disconnected';
            statusIndicator.classList.add('offline');
            return;
        }

        statusIndicator.textContent = 'Online';
        statusIndicator.classList.add('online');

        await fetchOrders();
        setupRealtime();
    };

    const fetchOrders = async () => {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return;
        }

        allOrders = data;
        renderDashboard();
    };

    const setupRealtime = () => {
        if (!supabaseClient) return;

        console.log('Initializing Realtime Reserve Listener...');
        
        const channel = supabaseClient
            .channel('orders-realtime-channel')
            .on(
                'postgres_changes', 
                { 
                    event: '*', 
                    table: 'orders', 
                    schema: 'public' 
                }, 
                (payload) => {
                    console.log('Change detected in reserve:', payload);
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                console.log('Realtime Status:', status);
                if (status === 'SUBSCRIBED') {
                    statusIndicator.textContent = 'Online (Live)';
                    statusIndicator.classList.add('live');
                }
            });
    };

    const renderDashboard = () => {
        let filtered = allOrders.filter(o => o.status === currentStatusFilter);

        if (selectedDate) {
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                return orderDate === selectedDate;
            });
        }

        const pending = allOrders.filter(o => o.status === 'pending').length;
        const revenue = allOrders.reduce((acc, o) => acc + parseFloat(o.total_price), 0);

        if (pendingCount) pendingCount.textContent = pending;
        if (totalVolume) totalVolume.textContent = `₱${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (filtered.length === 0) {
            ordersBody.innerHTML = `<tr><td colspan="7" class="loading-msg">No ${currentStatusFilter} orders ${selectedDate ? 'for this date ' : ''}found in the reserve.</td></tr>`;
            return;
        }

        ordersBody.innerHTML = filtered.map(order => {
            const dateStr = new Date(order.created_at).toLocaleString();
            const itemsList = order.order_items.map(item =>
                `<div class="item-row">${item.quantity}x ${item.name}</div>`
            ).join('');

            return `
                <tr class="${order.status}">
                    <td class="col-date" data-label="DATE & TIME">${dateStr}</td>
                    <td class="col-customer" data-label="CUSTOMER">${order.customer_name}</td>
                    <td class="col-contact" data-label="CONTACT">${order.contact_number}</td>
                    <td class="col-address" data-label="ADDRESS">${order.shipping_address}</td>
                    <td class="col-items" data-label="ITEMS">${itemsList}</td>
                    <td class="col-total" data-label="TOTAL">₱${parseFloat(order.total_price).toFixed(2)}</td>
                    <td class="col-payment" data-label="PAYMENT">
                        <span class="method-tag">${order.payment_method?.toUpperCase() || 'COD'}</span>
                        ${order.payment_proof_url 
                            ? `<button onclick="viewReceipt('${order.payment_proof_url}')" class="receipt-link">View Receipt</button>` 
                            : ''
                        }
                    </td>
                    <td class="col-action" data-label="ACTIONS">
                        <div class="action-group">
                            ${order.status === 'pending'
                                ? `<button class="btn-done-sm" onclick="markAsFinished('${order.id}')">Finish</button>`
                                : `<button class="btn-done-sm" disabled>Done</button>`
                            }
                            <button class="btn-delete" onclick="deleteOrder('${order.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const animateRowOut = (rowEl) => new Promise((resolve) => {
        rowEl.classList.add('removing');
        rowEl.addEventListener('animationend', resolve, { once: true });
    });

    window.markAsFinished = async (id) => {
        const btn = document.querySelector(`button[onclick="markAsFinished('${id}')"]`);
        const row = btn?.closest('tr');
        if (btn) btn.classList.add('btn-loading');

        const { error } = await supabaseClient
            .from('orders')
            .update({ status: 'finished' })
            .eq('id', id);

        if (error) {
            if (btn) btn.classList.remove('btn-loading');
            showModal({ title: 'Error', message: 'Could not update order: ' + error.message, onConfirm: () => {} });
        } else {
            if (row) await animateRowOut(row);
            await fetchOrders();
        }
    };

    window.deleteOrder = (id) => {
        showModal({
            title: 'Delete Order',
            message: 'Are you certain you wish to permanently remove this order from the archive? This action cannot be undone.',
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                const btn = document.querySelector(`button[onclick="deleteOrder('${id}')"]`);
                const row = btn?.closest('tr');
                if (btn) btn.classList.add('btn-loading');

                const { error } = await supabaseClient
                    .from('orders')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Deletion error:', error);
                    showModal({ title: 'Error', message: 'Could not delete order: ' + error.message, onConfirm: () => {} });
                } else {
                    if (row) await animateRowOut(row);
                    await fetchOrders();
                }
            }
        });
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatusFilter = btn.dataset.status;
            renderDashboard();
        });
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('sarsa_admin_auth');
        window.location.replace('./login/');
    });


    dateSelect.addEventListener('change', (e) => {
        selectedDate = e.target.value || null;
        renderDashboard();
    });

    clearDateBtn.addEventListener('click', () => {
        dateSelect.value = '';
        selectedDate = null;
        renderDashboard();
    });

    const receiptModal = document.getElementById('receipt-modal');
    const receiptImg = document.getElementById('receipt-img');
    const downloadBtn = document.getElementById('download-receipt');
    const closeReceiptBtn = document.getElementById('close-receipt');

    window.viewReceipt = (url) => {
        if (!url) return;
        receiptImg.src = url;
        downloadBtn.href = url;
        receiptModal.classList.remove('hidden');
    };

    const closeReceiptModal = () => {
        receiptModal.classList.add('hidden');
        receiptImg.src = ''; // Clear src when closing
    };

    closeReceiptBtn.addEventListener('click', closeReceiptModal);
    
    // Close on overlay click
    receiptModal.addEventListener('click', (e) => {
        if (e.target === receiptModal) closeReceiptModal();
    });

    init();
});
