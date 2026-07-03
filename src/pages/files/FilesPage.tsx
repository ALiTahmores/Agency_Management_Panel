import { Box, Card, CardContent, Typography } from '@mui/material';
import { AttachFile } from '@mui/icons-material';

export default function FilesPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>فایل‌ها</Typography>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <AttachFile sx={{ fontSize: 56, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            مدیریت فایل‌ها
          </Typography>
          <Typography variant="body2" color="text.secondary">
            بارگذاری و مدیریت فایل‌های پروژه در نسخه‌های آینده اضافه می‌شود
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
