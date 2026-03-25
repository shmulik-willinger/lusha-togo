import { useMutation } from '@tanstack/react-query';
import { uploadContactsCSV, PhoneContactForUpload } from '../api/csvUpload';

export function useUploadContacts() {
  return useMutation({
    mutationFn: (contacts: PhoneContactForUpload[]) => uploadContactsCSV(contacts),
  });
}
