export function useOwnership(selectedCourse, user) {
    const isOwner = selectedCourse
        ? (selectedCourse.ownerId == null || selectedCourse.ownerId === user?.uid)
        : true;

    return { isOwner };
}
