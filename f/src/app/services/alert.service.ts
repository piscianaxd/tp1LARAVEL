import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult, SweetAlertOptions } from 'sweetalert2';


// 🔥 USAR type en lugar de interface para extender
export type AlertOptions = {
  swal?: SweetAlertOptions;
  customProperty?: string;
};


@Injectable({
  providedIn: 'root'
})
export class AlertService {
  
  // ========== MÉTODOS GENÉRICOS ==========
  
  showAlert(title: string, text: string = '', icon: SweetAlertIcon = 'info'): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'Aceptar',
      timer: icon === 'success' ? 2000 : undefined
    });
  }

  showConfirm(options: AlertOptions): Promise<SweetAlertResult> {
    const defaultOptions: SweetAlertOptions = {
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    };

    const finalOptions = {
      ...defaultOptions,
      ...options.swal
    } as SweetAlertOptions;

    return Swal.fire(finalOptions);
  }


  // 🔥 NUEVO MÉTODO para confirmaciones destructivas
  showDestructiveConfirm(options: AlertOptions): Promise<SweetAlertResult> {
    const defaultOptions: SweetAlertOptions = {
      title: '⚠️ Confirmación Requerida',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    };

    return Swal.fire({
      ...defaultOptions,
      ...options
    });
  }

  showSuccess(title: string, text: string = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      toast: true,               // 👈 lo convierte en toast (pequeño)
      position: 'top-end',       // esquina superior derecha
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      customClass: {
        popup: 'swal-toast-offset swal-zindex' // para moverlo más abajo y ajustar z-index
      }
    });
  }



  showError(title: string, text: string = ''): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33'
    });
  }

  showLoading(title: string = 'Procesando...'): void {
    Swal.fire({
      title,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  closeLoading(): void {
    Swal.close();
  }

  showToast(title: string, icon: SweetAlertIcon = 'success', timer: number = 3000): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({ icon, title });
  }

  // ========== MÉTODOS ESPECÍFICOS DE PLAYLIST ==========
  
  async confirmDeletePlaylist(playlistName: string): Promise<boolean> {
    const result = await this.showConfirm({
      swal: {
        title: 'Eliminar Playlist',
        text: `¿Estás seguro de eliminar "${playlistName}"? Todas las canciones se perderán.`,
        icon: 'warning',
        confirmButtonText: 'Sí, eliminar'
      }
    });

    return result.isConfirmed;
  }

  async confirmRemoveSong(songName: string, playlistName: string): Promise<boolean> {
    const result = await this.showConfirm({
      swal: {
        title: 'Eliminar Canción',
        text: `¿Eliminar "${songName}" de "${playlistName}"?`,
        icon: 'question'
      }
    });
    return result.isConfirmed;
  }

  showPlaylistSaved(playlistName: string): void {
    this.showToast(`"${playlistName}" guardada correctamente`, 'success');
  }

  showPlaylistError(error: string): void {
    this.showError('Error en Playlist', error);
  }

  // ========== MÉTODOS ESPECÍFICOS DE AUTH ==========
  
  async confirmLogout(): Promise<boolean> {
    const result = await this.showConfirm({
      swal: {
        title: 'Cerrar Sesión',
        text: '¿Estás seguro de que quieres salir?',
        icon: 'question'
      }
    });
    return result.isConfirmed;
  }

  async confirmAccountDeletion(): Promise<boolean> {
    const result = await this.showConfirm({
      swal: {
        title: 'Eliminar Cuenta',
        text: '¿Estás completamente seguro? Esta acción es irreversible y perderás todos tus datos.',
        icon: 'warning',
        confirmButtonText: 'Sí, eliminar cuenta'
      }
    });
    return result.isConfirmed;
  }

  showLoginError(message: string): void {
    this.showError('Error de Acceso', message);
  }

  // ========== MÉTODOS ESPECÍFICOS DE MÚSICA ==========
  
  showSongAdded(songName: string, playlistName: string): void {
    this.showToast(`"${songName}" agregada a ${playlistName}`, 'success');
  }

  showSongError(message: string): void {
    this.showError('Error con Canción', message);
  }

  // ========== MÉTODOS ESPECÍFICOS DE BÚSQUEDA ==========
  
  showSearchError(term: string): void {
    this.showError('Búsqueda Fallida', `No se encontraron resultados para "${term}"`);
  }

  // ========== MÉTODOS DE CONFIRMACIÓN AVANZADOS ==========
  
  async confirmWithPassword(originalPassword: string): Promise<boolean> {
    const result = await this.showDestructiveConfirm({
      swal: {
        title: '🔒 Confirmar con Contraseña',
        html: `
          <div class="text-start">
            <p>Para confirmar esta acción, ingresa tu contraseña:</p>
            <input type="password" id="password-confirm" class="form-control mt-2" placeholder="Tu contraseña">
            <div id="password-error" class="text-danger small mt-1" style="display: none;">
              Contraseña incorrecta
            </div>
          </div>
        `,
        preConfirm: () => {
          return new Promise((resolve) => {
            const passwordInput = document.getElementById('password-confirm') as HTMLInputElement;
            const errorDiv = document.getElementById('password-error') as HTMLDivElement;

            if (!passwordInput.value) {
              errorDiv.textContent = 'Debes ingresar tu contraseña';
              errorDiv.style.display = 'block';
              resolve(false);
              return;
            }

            if (passwordInput.value !== originalPassword) {
              errorDiv.textContent = 'La contraseña no coincide';
              errorDiv.style.display = 'block';
              resolve(false);
              return;
            }

            errorDiv.style.display = 'none';
            resolve(true);
          });
        }
      }
    });

    return result.isConfirmed;
  }


  // ========== MÉTODOS DE NOTIFICACIÓN RÁPIDA ==========
  
  success(message: string): void {
    this.showToast(message, 'success');
  }

  error(message: string): void {
    this.showToast(message, 'error', 5000);
  }

  warning(message: string): void {
    this.showToast(message, 'warning');
  }

  info(message: string): void {
    this.showToast(message, 'info');
  }
}