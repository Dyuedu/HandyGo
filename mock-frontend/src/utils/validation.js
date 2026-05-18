export function validateUsername(username) {
  if (!username.trim()) return 'Vui lòng nhập tên đăng nhập'
  if (username.length < 4 || username.length > 50) return 'Tên đăng nhập phải từ 4 đến 50 ký tự'
  if (/\s/.test(username)) return 'Tên đăng nhập không được chứa khoảng trắng'
  return ''
}

export function validatePassword(password) {
  if (!password) return 'Vui lòng nhập mật khẩu'
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    return 'Mật khẩu cần chữ hoa, chữ thường, số và ký tự đặc biệt'
  }
  return ''
}

export function validatePhone(phone) {
  if (!phone) return ''
  if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone)) return 'Số điện thoại Việt Nam không hợp lệ'
  return ''
}
