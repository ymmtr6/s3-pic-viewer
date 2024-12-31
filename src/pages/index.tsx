import { useEffect, useState } from 'react';
import { Box, Heading, Spinner, Button, Flex, SimpleGrid } from '@chakra-ui/react';
import Image from 'next/image';
import Modal from 'react-modal';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

Modal.setAppElement('#__next');

const customStyles = {
  content: {
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    margin: '0',
    padding: '0',
    border: 'none',
    borderRadius: '0',
    overflow: 'hidden',
  },
};

const Home = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFiles = files.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () => setCurrentPage((prev) => prev + 1);
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const openModal = (file: any) => {
    setSelectedImage(file);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedImage(null);
  };

  const imageUrl = (file: any) => `/api/p/${encodeURIComponent(file.Key)}`;

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/listFiles');
        const data = await response.json();
        if (Array.isArray(data)) {
          // Sort files by LastModified date in descending order
          const sortedFiles = data.sort((a, b) => new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime());
          setFiles(sortedFiles);
        } else {
          console.error('Unexpected response format:', data);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <>
      {!modalIsOpen && (
        <Box as="header" position="fixed" top="0" left="0" width="100%" color="white" bg="gray.800" zIndex="1000" p={1} boxShadow="md">
          <Heading mb={0}>S3 Bucket Image Viewer</Heading>
        </Box>
      )}
      <Box p={5} pt={modalIsOpen ? "0" : "64px"}>
        {loading ? (
          <Spinner />
        ) : (
          <SimpleGrid columns={[2, null, 4]} gridGap="40px">
            {currentFiles.map((file, index) => (
              <Box key={index} display="flex" justifyContent="center" alignItems="center" overflow="hidden" height="200px" onClick={() => openModal(file)}>
                {file.Key && (
                  <Image
                    src={imageUrl(file)}
                    alt={file.Key}
                    width={200}
                    height={200}
                    style={{ objectFit: 'contain' }}
                    priority={true}
                  />
                )}
              </Box>
            ))}
          </SimpleGrid>
        )}
        <Flex
          position="fixed"
          bottom="10px"
          left="50%"
          transform="translateX(-50%)"
          justifyContent={currentPage === 1 ? 'flex-end' : 'space-between'}
          width="80%"
        >
          <Button onClick={prevPage} disabled={currentPage === 1} display={currentPage === 1 ? 'none' : 'inline-flex'}>
            <FaArrowLeft />
          </Button>
          <Button onClick={nextPage} disabled={indexOfLastItem >= files.length} display={indexOfLastItem >= files.length ? 'none' : 'inline-flex'}>
            <FaArrowRight />
          </Button>
        </Flex>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Image Modal"
          style={customStyles}
          shouldCloseOnOverlayClick={true}
        >
          {selectedImage && (
            <Box position="relative" width="100%" height="100%" bg="black" onClick={closeModal}>
              <Image
                src={imageUrl(selectedImage)}
                alt="Selected Image"
                fill
                style={{ objectFit: 'contain' }}
                priority={true}
                quality={100}
              />
            </Box>
          )}
          <Button onClick={closeModal} position="absolute" top="10px" right="10px">Close</Button>
        </Modal>
      </Box>
    </>
  );
};

export default Home;
