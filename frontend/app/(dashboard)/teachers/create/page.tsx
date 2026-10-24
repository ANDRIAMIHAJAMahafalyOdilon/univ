import { redirect } from 'next/navigation';

/** Ancienne route « création » : le formulaire est désormais une modale sur la liste des enseignants. */
export default function TeachersCreateRedirectPage() {
  redirect('/teachers');
}
