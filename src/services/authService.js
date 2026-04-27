export const authService = {
  async logout() {
    localStorage.removeItem('auth-token')
    return { success: true }
  }
}