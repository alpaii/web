# Cloudinary 설정 가이드

이 프로젝트는 이미지 업로드를 위해 Cloudinary를 사용합니다.

## 1. Cloudinary 계정 생성

1. [Cloudinary](https://cloudinary.com)에 접속하여 무료 계정을 생성합니다
2. 이메일 인증을 완료합니다

## 2. Upload Preset 생성

1. Cloudinary 대시보드에 로그인합니다
2. 상단 메뉴에서 **Settings** (톱니바퀴 아이콘)를 클릭합니다
3. 왼쪽 메뉴에서 **Upload**를 선택합니다
4. 아래로 스크롤하여 **Upload presets** 섹션을 찾습니다
5. **Add upload preset** 버튼을 클릭합니다
6. 다음과 같이 설정합니다:
   - **Upload preset name**: `classical_albums` (또는 원하는 이름)
   - **Signing Mode**: **Unsigned** (중요!)
   - **Folder**: `classical-albums` (선택사항)
   - 나머지는 기본값 유지
7. **Save** 버튼을 클릭합니다

## 3. Cloud Name 및 Upload Preset 확인

1. Cloudinary 대시보드 상단에서 **Cloud name**을 확인합니다
   - 예: `dxxxxxx123` 형태의 문자열
2. 방금 생성한 **Upload preset name**을 확인합니다
   - 예: `classical_albums`

## 4. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일을 열고 다음 값들을 설정합니다:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

**예시:**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxxx123
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=classical_albums
```

## 5. 개발 서버 재시작

환경 변수를 변경했으므로 개발 서버를 재시작합니다:

```bash
npm run dev
```

## 6. 테스트

1. 작곡가 페이지로 이동합니다
2. 작곡가를 추가하거나 수정합니다
3. 이미지를 업로드합니다
4. 정상적으로 업로드되는지 확인합니다

업로드된 이미지는 Cloudinary 대시보드의 **Media Library**에서 확인할 수 있습니다.

## 무료 플랜 제한사항

- **저장공간**: 25 GB
- **월간 대역폭**: 25 GB
- **월간 변환**: 25 크레딧

일반적인 사용에는 충분합니다. 제한을 초과하면 유료 플랜으로 업그레이드가 필요합니다.

## 추가 설정 (선택사항)

### 이미지 자동 최적화

Cloudinary는 기본적으로 이미지를 최적화합니다. 추가 설정을 원하면:

1. Upload preset 설정에서 **Eager transformations** 추가
2. 예: `w_800,h_800,c_limit,q_auto,f_auto`

### 폴더 구조

업로드된 이미지는 자동으로 다음 폴더 구조로 저장됩니다:

- `classical-albums/composers` - 작곡가 사진
- `classical-albums/albums` - 앨범 커버 이미지
- `classical-albums/artists` - 아티스트 사진 (향후 추가 예정)

폴더는 코드에서 자동으로 관리되므로 별도 설정이 필요 없습니다.

## 문제 해결

### "Cloudinary configuration missing" 오류

- `.env.local` 파일에 환경 변수가 제대로 설정되었는지 확인
- 개발 서버를 재시작했는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 포함)

### "Upload failed" 오류

- Upload preset의 **Signing Mode**가 **Unsigned**로 설정되었는지 확인
- Cloud name과 Upload preset 이름이 정확한지 확인
- 인터넷 연결 확인

### 이미지가 보이지 않음

- 브라우저 콘솔에서 이미지 URL 확인
- Cloudinary Media Library에서 이미지가 업로드되었는지 확인
- CORS 설정 확인 (기본적으로 모든 도메인 허용)
